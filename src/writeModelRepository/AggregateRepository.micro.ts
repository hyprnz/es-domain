import * as Uuid from '../util/UUID'
import { assertThat, match } from 'mismatched'
import { ChangeEvent, EntityEvent } from '../eventSourcing/MessageTypes'
import { OptimisticConcurrencyError } from './OptimisticConcurrencyError'
import { InMemoryEventStore } from './InMemoryEventStore'
import { AlarmCreatedEvent } from '../deviceBoundedContext/events/internal/AlarmCreatedEvent'
import { DeviceCreatedEvent } from '../deviceBoundedContext/events/internal/DeviceCreatedEvent'
import { EventBusProducer } from '../eventBus/EventBusProcessor'
import { AggregateRepository, AggregateRootRepositoryBuilder } from '../eventSourcing/AggregateRootRepo'
import { Device, DeviceCreationParmaters } from '../deviceBoundedContext/domain/Device'
import { EventStore } from './EventStore'

describe('AggregateRootRepository', () => {
  let eventStore: EventStore
  let repository: AggregateRepository<Device, DeviceCreationParmaters>

  beforeEach(() => {
    eventStore = AggregateRootRepositoryBuilder.makeEventStore(new InMemoryEventStore(), new EventBusProducer())
    repository = AggregateRootRepositoryBuilder.makeRepo(eventStore, Device)
  })

  it('stores events', async () => {
    const deviceId = Uuid.createV4()
    const alarmId = Uuid.createV4()

    let emittedEvents: Array<EntityEvent> = []
    const handler = async (changes: Array<EntityEvent>) => {
      emittedEvents = emittedEvents.concat(changes)
      return
    }
    eventStore.registerCallback(changes => handler(changes))


    const [device, container] =  await repository.create({id: deviceId, colour:'red'})
    device.addAlarm(alarmId)

    const uncommittedEvents = container.uncommittedChanges()
    const countEvents = await device.save()

    assertThat(countEvents).withMessage('Stored Event count').is(2)
    assertThat(emittedEvents).withMessage('Emitted Events').is(match.array.length(2))
    assertThat(uncommittedEvents).is(emittedEvents)
  })

  it('loads events', async () => {
    const deviceId = Uuid.createV4()
    const alarmId = Uuid.createV4()

    const [device, deviceContainer] =  await repository.create({id: deviceId, colour:'red'})
    device.addAlarm(alarmId)

    const uncommittedEvents = deviceContainer.uncommittedChanges()
    await device.save()

    // Compare Saved event to loaded make sure they are thesame
    const loadedEvents = await eventStore.getEvents(deviceId)

    assertThat(uncommittedEvents).is(loadedEvents)
    assertThat(loadedEvents).is(match.array.length(2))
  })

  describe('Event middleware', ()=>{

    it('calls event middleware for configured events only', async ()=>{
      const id = Uuid.createV4()
      const deviceId = Uuid.createV4()

      const middleware = async (evt:ChangeEvent) => {
        return {
          ...evt,
          "my-test-value": id
        }
      }

      eventStore.registerEventDeserializer(AlarmCreatedEvent.eventType, middleware)

      const [deviceAggregate] = await repository.create({id: deviceId, colour:'red'})
      return deviceAggregate.save()
        .then(() =>   eventStore.getEvents(deviceId))
        .then(events => events.filter(x => DeviceCreatedEvent.isDeviceCreatedEvent(x.event)))
        .then(events => {
          assertThat(events).is(match.array.length(1))
          assertThat(events[0].event)
            .withMessage("Does not call middleware for other event types")
            .isNot(match.obj.has({"my-test-value": id}))
        })

    })
    it('calls event middleware after loading evens', async ()=>{
      const id = Uuid.createV4()
      const deviceId = Uuid.createV4()

      const middleware = async (evt:ChangeEvent) => {
        return {
          ...evt,
          "my-test-value": id
        }
      }

      eventStore.registerEventDeserializer(DeviceCreatedEvent.eventType, middleware)

      const [device] = await repository.create({id: deviceId, colour:'red'})
      return device.save()
        .then(() =>   eventStore.getEvents(deviceId))
        .then(events => events.filter(x => DeviceCreatedEvent.isDeviceCreatedEvent(x.event)))
        .then(events => {
          assertThat(events).is(match.array.length(1))
          assertThat(events[0].event).is(match.obj.has({
            "my-test-value": id
          }))
        })
    })

    it('registers multiple chained middleware after loading evens', async ()=>{
      const id = Uuid.createV4()
      const deviceId = Uuid.createV4()

      const middleware1 = async (evt:ChangeEvent) => {
        return {
          ...evt,
          "my-test-value-1": id
        }
      }

      const middleware2 = async (evt:ChangeEvent) => {
        return {
          ...evt,
          "my-test-value-2": id
        }
      }

      eventStore.registerEventDeserializer(DeviceCreatedEvent.eventType, middleware1)
      eventStore.registerEventDeserializer(DeviceCreatedEvent.eventType, middleware2, true)

      const [deviceAggregate] = await repository.create({id: deviceId, colour:'red'})
      return deviceAggregate.save()
        .then(() =>   eventStore.getEvents(deviceId))
        .then(events => events.filter(x => DeviceCreatedEvent.isDeviceCreatedEvent(x.event)))
        .then(events => {
          assertThat(events).is(match.array.length(1))
          assertThat(events[0].event).is(match.obj.has({
            "my-test-value-1": id,
            "my-test-value-2": id
          }))
        })
    })
  })


  it('loads entities from events', async () => {
    const deviceId = Uuid.createV4()
    const alarmId = Uuid.createV4()

    const [deviceAggregate] = await repository.create({id: deviceId, colour:'red'})
    deviceAggregate.addAlarm(alarmId)

    const alarm = deviceAggregate.findAlarm(alarmId)
    await deviceAggregate.save()

    const [rehydratedAggregate] = await repository.get(deviceId)
    const foundAlarm = rehydratedAggregate.findAlarm(alarmId)
    assertThat(foundAlarm).isNot(undefined)
    assertThat(foundAlarm).is(alarm)
  })

  it('loads entities from events without creating new events', async () => {
    const deviceId = Uuid.createV4()
    const alarmId = Uuid.createV4()

    const [device] = await repository.create({id: deviceId, colour:'red'})
    device.addAlarm(alarmId)

    // changes stored, uncommitted changes cleared
    await device.save()

    const [rehydrateddevice, aggregatecontainer] = await repository.get(deviceId)
    const uncommittedEvents = aggregatecontainer.uncommittedChanges()
    // rehydration should not result in new events
    assertThat(uncommittedEvents).is(match.array.length(0))
  })

  it('detects concurrency issue', async () => {
    const deviceId = Uuid.createV4()
    const alarmId = Uuid.createV4()

    const [deviceAggregate] = await repository.create({id: deviceId, colour:'red'})
    deviceAggregate.addAlarm(alarmId)
    await deviceAggregate.save()

    const [anotherDeviceAggregate] = await repository.get(deviceId)

    deviceAggregate.addAlarm(Uuid.createV4())
    anotherDeviceAggregate.addAlarm(Uuid.createV4())

    await deviceAggregate.save()
    await anotherDeviceAggregate.save().then(
      () => fail('Expected Optimistic concurrency error here!!'),
      (e: any) => {
        assertThat(e instanceof OptimisticConcurrencyError).is(true)
        assertThat(e.message).is(`Optimistic concurrency error for aggregate root id: ${deviceAggregate.id}, version: ${2}`)
      }
    )
  })

  it('get, throws when no events', async () => {
    return repository.get(Uuid.createV4())
      .then(
        success => fail("should not get here"),
        fail => assertThat(fail).is(new Error("Not Found"))
      )
  })

  it('find, returns undefined when no events', async () => {
    const device = await repository.find(Uuid.createV4())
    assertThat(device).is(undefined)
  })

})
