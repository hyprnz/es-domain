import * as Uuid from '../eventSourcing/UUID'
import { AggregateRepository } from './AggregateRepository'
import { assertThat, match } from 'mismatched'
import { ChangeEvent, EntityEvent } from '../eventSourcing/MessageTypes'
import { WriteModelRepository } from './WriteModelRepository'
import { OptimisticConcurrencyError } from './OptimisticConcurrencyError'
import { InMemoryEventStore } from './InMemoryEventStore'
import { DeviceAggregate } from '../deviceBoundedContext/domain/DeviceAggregate'
import { AlarmCreatedEvent } from '../deviceBoundedContext/events/internal/AlarmCreatedEvent'
import { DeviceCreatedEvent } from '../deviceBoundedContext/events/internal/DeviceCreatedEvent'

describe('AggregateRootRepository', () => {
  let repository: WriteModelRepository

  beforeEach(() => {
    repository = new AggregateRepository(new InMemoryEventStore())
  })

  it('stores events', async () => {
    const deviceId = Uuid.createV4()
    const alarmId = Uuid.createV4()

    const deviceAggregate = new DeviceAggregate().withDevice(deviceId, 'red')
    deviceAggregate.addAlarm(alarmId)

    const uncommittedEvents = deviceAggregate.uncommittedChanges()

    let emittedEvents: Array<EntityEvent> = []
    const handler = async (changes: Array<EntityEvent>) => {
      emittedEvents = emittedEvents.concat(changes)
      return
    }
    repository.subscribeToChangesSynchronously(changes => handler(changes))

    const countEvents = await repository.save(deviceAggregate)

    assertThat(countEvents).withMessage('Stored Event count').is(2)
    assertThat(emittedEvents).withMessage('Emitted Events').is(match.array.length(2))
    assertThat(uncommittedEvents).is(emittedEvents)
  })

  it('loads events', async () => {
    const deviceId = Uuid.createV4()
    const alarmId = Uuid.createV4()

    const deviceAggregate = new DeviceAggregate().withDevice(deviceId, 'red')
    deviceAggregate.addAlarm(alarmId)

    const uncommittedEvents = deviceAggregate.uncommittedChanges()
    await repository.save(deviceAggregate)

    // Compare Saved event to loaded make sure they are thesame
    const loadedEvents = await repository.loadEvents(deviceId)

    assertThat(uncommittedEvents).is(loadedEvents)
    assertThat(loadedEvents).is(match.array.length(2))
  })

  describe('Event middleware', ()=>{

    it('calls event middleware for configured events only', ()=>{
      const id = Uuid.createV4()
      const deviceId = Uuid.createV4()

      const middleware = async (evt:ChangeEvent) => {
        return {
          ...evt,
          "my-test-value": id
        }
      }

      repository.addEventPostProcessor(AlarmCreatedEvent.eventType, middleware)

      const deviceAggregate = new DeviceAggregate().withDevice(deviceId, 'red')
      return repository.save(deviceAggregate)
        .then(() =>   repository.loadEvents(deviceId))
        .then(events => events.filter(x => DeviceCreatedEvent.isDeviceCreatedEvent(x.event)))
        .then(events => {
          assertThat(events).is(match.array.length(1))
          assertThat(events[0].event)
            .withMessage("Does not call middleware for other event types")
            .isNot(match.obj.has({"my-test-value": id}))
        })

    })
    it('calls event middleware after loading evens', ()=>{
      const id = Uuid.createV4()
      const deviceId = Uuid.createV4()

      const middleware = async (evt:ChangeEvent) => {
        return {
          ...evt,
          "my-test-value": id
        }
      }

      repository.addEventPostProcessor(DeviceCreatedEvent.eventType, middleware)

      const deviceAggregate = new DeviceAggregate().withDevice(deviceId, 'red')
      return repository.save(deviceAggregate)
        .then(() =>   repository.loadEvents(deviceId))
        .then(events => events.filter(x => DeviceCreatedEvent.isDeviceCreatedEvent(x.event)))
        .then(events => {
          assertThat(events).is(match.array.length(1))
          assertThat(events[0].event).is(match.obj.has({
            "my-test-value": id
          }))
        })
    })

    it('registers multiple chained middleware after loading evens', ()=>{
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

      repository.addEventPostProcessor(DeviceCreatedEvent.eventType, middleware1)
      repository.addEventPostProcessor(DeviceCreatedEvent.eventType, middleware2, true)

      const deviceAggregate = new DeviceAggregate().withDevice(deviceId, 'red')
      return repository.save(deviceAggregate)
        .then(() =>   repository.loadEvents(deviceId))
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

    const deviceAggregate = new DeviceAggregate().withDevice(deviceId, 'red')

    deviceAggregate.addAlarm(alarmId)

    const alarm = deviceAggregate.findAlarm(alarmId)
    await repository.save(deviceAggregate)

    const rehydratedAggregate = await repository.load(deviceId, new DeviceAggregate())
    const foundAlarm = rehydratedAggregate.findAlarm(alarmId)
    assertThat(foundAlarm).isNot(undefined)
    assertThat(foundAlarm).is(alarm)
  })

  it('loads entities from events without creating new events', async () => {
    const deviceId = Uuid.createV4()
    const alarmId = Uuid.createV4()

    const deviceAggregate = new DeviceAggregate().withDevice(deviceId, 'red')
    deviceAggregate.addAlarm(alarmId)

    // changes stored, uncommitted changes cleared
    await repository.save(deviceAggregate)

    const rehydratedAggregate = await repository.load(deviceId, new DeviceAggregate())
    const uncommittedEvents = rehydratedAggregate.uncommittedChanges()
    // rehydration should not result in new events
    assertThat(uncommittedEvents).is(match.array.length(0))
  })

  it('detects concurrency issue', async () => {
    const deviceId = Uuid.createV4()
    const alarmId = Uuid.createV4()

    const deviceAggregate = new DeviceAggregate().withDevice(deviceId, 'red')
    deviceAggregate.addAlarm(alarmId)
    await repository.save(deviceAggregate)

    const anotherDeviceAggregate = await repository.load(deviceId, new DeviceAggregate())

    deviceAggregate.addAlarm(Uuid.createV4())
    anotherDeviceAggregate.addAlarm(Uuid.createV4())

    await repository.save(deviceAggregate)
    await repository.save(anotherDeviceAggregate).then(
      () => fail('Expected Optimistic concurrency error here!!'),
      (e: any) => {
        assertThat(e instanceof OptimisticConcurrencyError).is(true)
        assertThat(e.message).is(`Optimistic concurrency error for aggregate root id: ${deviceAggregate.id}, version: ${2}`)
      }
    )
  })

  it('loads when no events', async () => {
    const deviceId = Uuid.createV4()
    const alarmId = Uuid.createV4()

    const rehydratedAggregate = await repository.load(deviceId, new DeviceAggregate())
    const uncommittedEvents = rehydratedAggregate.uncommittedChanges()
    // rehydration should not result in new events
    assertThat(uncommittedEvents).is(match.array.length(0))

    assertThat(() => rehydratedAggregate.id).throws(new Error('Not Found'))
  })

})
