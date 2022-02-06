import * as Uuid from '../EventSourcing/UUID'
import {Device, Alarm} from '../deviceBoundedContext'
import * as deviceEvents from '../deviceBoundedContext/events/deviceEvents'
import { WriteModelMemoryRepository } from './WriteModelMemoryRepository'
import { assertThat, match } from 'mismatched'
import { write } from 'fs'
describe("WriteModelMemoryRepository", ()=>{
  it("stores events", async ()=>{
    const deviceId = Uuid.createV4()
    const alarmId = Uuid.createV4()
    const writeModelRepo = new WriteModelMemoryRepository()

    const device = new Device(deviceId)
    device.addAlarm(alarmId)
    const uncomittedEvents = device.uncommittedChanges()
    
    const emittedEvents = []
    writeModelRepo.subscribeToChanges(changes => changes.forEach(x => emittedEvents.push(x)))
    
    const countEvents = await writeModelRepo.save(device)

    assertThat(countEvents).withMessage("Stored Event count").is(2)
    assertThat(emittedEvents).withMessage("Emitted Events").is(match.array.length(2))
    assertThat(uncomittedEvents).is(emittedEvents)
  })

  it("loads events", async ()=>{
    const deviceId = Uuid.createV4()
    const alarmId = Uuid.createV4()
    const writeModelRepo = new WriteModelMemoryRepository()

    const device = new Device(deviceId)
    device.addAlarm(alarmId)
    const uncomittedEvents = device.uncommittedChanges()
    
    const loadedDevice = await writeModelRepo.load<Device>(deviceId, () => new Device())
    const loadedUncommited = loadedDevice.uncommittedChanges()

    assertThat(uncomittedEvents).is(loadedUncommited)
  })
})