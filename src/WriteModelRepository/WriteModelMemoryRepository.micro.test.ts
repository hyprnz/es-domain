import * as Uuid from '../EventSourcing/UUID'
import { WriteModelMemoryRepository } from './WriteModelMemoryRepository'
import { assertThat, match } from 'mismatched'
import { EntityEvent } from '../EventSourcing/EventSourcingTypes'
import { AggregateContainer } from '../EventSourcing/AggregateRoot'
import { Device } from '../deviceBoundedContext'
import { WriteModelRepositroy } from '../EventSourcing/WriteModelTypes'
describe("WriteModelMemoryRepository", ()=>{

  it("stores events", async ()=>{
    const deviceId = Uuid.createV4()
    const alarmId = Uuid.createV4()
    const writeModelRepo: WriteModelRepositroy = new WriteModelMemoryRepository()

    const deviceAggregate = new AggregateContainer<Device>((p,id) => new Device(p,id), deviceId)
    deviceAggregate.rootEntity.addAlarm(alarmId)

    const uncomittedEvents = deviceAggregate.uncommittedChanges()
    
    const emittedEvents: Array<EntityEvent> = []
    writeModelRepo.subscribeToChanges(changes => changes.forEach(x => emittedEvents.push(x)))
    
    const countEvents = await writeModelRepo.save(deviceAggregate)

    assertThat(countEvents).withMessage("Stored Event count").is(2)
    assertThat(emittedEvents).withMessage("Emitted Events").is(match.array.length(2))
    assertThat(uncomittedEvents).is(emittedEvents)
  })

  it("loads events", async ()=>{
    const deviceId = Uuid.createV4()
    const alarmId = Uuid.createV4()
    const writeModelRepo: WriteModelRepositroy = new WriteModelMemoryRepository()

    const deviceAggregate = new AggregateContainer<Device>(
      (p,id) => new Device(p,id),
      deviceId
    )

    const device = deviceAggregate.rootEntity
    device.addAlarm(alarmId)

    const uncomittedEvents = deviceAggregate.uncommittedChanges()
    writeModelRepo.save(deviceAggregate)
    
    // Compare Saved event to loaded make sure they are thesame
    const loadedEvents = await writeModelRepo.loadEvents(deviceId)
    
    assertThat(uncomittedEvents).is(loadedEvents)
    assertThat(loadedEvents).is(match.array.length(2))
  })

  it('detects concurrency', async()=>{
    const deviceId = Uuid.createV4()
    const alarmId = Uuid.createV4()
    const writeModelRepo: WriteModelRepositroy = new WriteModelMemoryRepository()

    const deviceAggregate = new AggregateContainer<Device>((p,id) => new Device(p,id), deviceId)

    const device = deviceAggregate.rootEntity
    device.addAlarm(alarmId)

    writeModelRepo.save(deviceAggregate)


    const anotherDeviceAggregate = await writeModelRepo.load(
      deviceId,
      (id) => new AggregateContainer<Device>((p,id) => new Device(p,id)),       
    )
    const anotherDevice = anotherDeviceAggregate.rootEntity

    device.addAlarm(Uuid.createV4())
    anotherDevice.addAlarm(Uuid.createV4())

    await writeModelRepo.save(deviceAggregate)
    await writeModelRepo.save(anotherDeviceAggregate)
      .then(
        () => fail("Expected and Optimistic concurrency error here!!"),
        e => assertThat(e.message).is(`Error:AggregateRoot, Optimistic concurrency error, expected event version:3 but received 2, Suggested solution is to retry`)
      )
  })
})

const payload = {} as any

const newState = Object.keys(payload).reduce((state, key) =>{
  state[key] = payload[key]
  return state
}, {} as any);
