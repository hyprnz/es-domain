import * as Uuid from '../EventSourcing/UUID'
import {DeviceAggregateRoot as Device} from '../deviceBoundedContext'
import { WriteModelMemoryRepository } from './WriteModelMemoryRepository'
import { assertThat, match } from 'mismatched'
import { IWriteModelRepositroy } from './WriteModelRepositoryTypes'
import { EntityEvent } from '../EventSourcing/EventSourcingTypes'
describe("WriteModelMemoryRepository", ()=>{
  it("stores events", async ()=>{
    const deviceId = Uuid.createV4()
    const alarmId = Uuid.createV4()
    const writeModelRepo: IWriteModelRepositroy = new WriteModelMemoryRepository()

    const device = new Device(deviceId)
    device.addAlarm(alarmId)
    const uncomittedEvents = device.uncommittedChanges()
    
    const emittedEvents: Array<EntityEvent> = []
    writeModelRepo.subscribeToChanges(changes => changes.forEach(x => emittedEvents.push(x)))
    
    const countEvents = await writeModelRepo.save(device)

    assertThat(countEvents).withMessage("Stored Event count").is(2)
    assertThat(emittedEvents).withMessage("Emitted Events").is(match.array.length(2))
    assertThat(uncomittedEvents).is(emittedEvents)
  })

  xit("loads events", async ()=>{
    const deviceId = Uuid.createV4()
    const alarmId = Uuid.createV4()
    const writeModelRepo: IWriteModelRepositroy = new WriteModelMemoryRepository()

    const device = new Device(deviceId)
    device.addAlarm(alarmId)
    const uncomittedEvents = device.uncommittedChanges()
    writeModelRepo.save(device)
    
    // this dosent look right?
    const loadedDevice = await writeModelRepo.load<Device>(deviceId, () => new Device())
    const loadedUncommited = loadedDevice.uncommittedChanges()

    assertThat(uncomittedEvents).is(loadedUncommited)
  })

  it('detects concurrency', async()=>{
    const deviceId = Uuid.createV4()
    const alarmId = Uuid.createV4()
    const writeModelRepo: IWriteModelRepositroy = new WriteModelMemoryRepository()

    const device = new Device(deviceId)
    device.addAlarm(alarmId)
    writeModelRepo.save(device)


    const anotherDevice = await writeModelRepo.load(device.id, () => new Device())
    
    device.addAlarm(Uuid.createV4())
    anotherDevice.addAlarm(Uuid.createV4())

    await writeModelRepo.save(device)
    await writeModelRepo.save(anotherDevice)
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
