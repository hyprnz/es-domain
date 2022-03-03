import * as Uuid from '../EventSourcing/UUID'
import { WriteModelMemoryRepository } from './WriteModelMemoryRepository'
import { assertThat, match } from 'mismatched'
import { WriteModelRepository } from './WriteModelRepositoryTypes'
import { EntityEvent } from '../EventSourcing/EventSourcingTypes'
import { Device } from '../deviceBoundedContext'
import { Aggregate } from '../EventSourcing/Aggregate'
describe("WriteModelMemoryRepository", ()=>{

  it("stores events", async ()=>{
    const deviceId = Uuid.createV4()
    const alarmId = Uuid.createV4()
    const writeModelRepo: WriteModelRepository = new WriteModelMemoryRepository()

    const deviceAggregate = new Aggregate(deviceId, (id, p) => new Device(p, id))
    deviceAggregate.rootEntity.initialise()
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
    const writeModelRepo: WriteModelRepository = new WriteModelMemoryRepository()

    const deviceAggregate = new Aggregate(
      deviceId,
      (id, p) => new Device(p,id)
    )

    const device = deviceAggregate.rootEntity
    device.initialise()
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
    const writeModelRepo: WriteModelRepository = new WriteModelMemoryRepository()

    const deviceAggregate = new Aggregate(deviceId,(id, p) => new Device(p,id))

    const device = deviceAggregate.rootEntity
    device.initialise()
    device.addAlarm(alarmId)

    writeModelRepo.save(deviceAggregate)


    const anotherDeviceAggregateInstance = await writeModelRepo.load(
      deviceId,
      (id) => new Aggregate(deviceId, (id, p) => new Device(p,id)),
    )
    const anotherDevice = anotherDeviceAggregateInstance.rootEntity
    anotherDevice.initialise()

    device.addAlarm(Uuid.createV4())
    anotherDevice.addAlarm(Uuid.createV4())

    await writeModelRepo.save(deviceAggregate)
    await writeModelRepo.save(anotherDeviceAggregateInstance)
      .then(
        () => fail("Expected and Optimistic concurrency error here!!"),
        e => assertThat(e.message).is(`Error:AggregateRoot, Optimistic concurrency error, expected event version:3 but received 2, Suggested solution is to retry`)
      )
  })
})
