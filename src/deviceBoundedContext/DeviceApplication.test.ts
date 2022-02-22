
import * as Uuid from '../EventSourcing/UUID'
import { EntityEvent } from "../EventSourcing/EventSourcingTypes";
import { ReadModelMemoryRepository } from "../ReadModelRepository/ReadModelMemoryRepository";
import { WriteModelMemoryRepository } from "../WriteModelRepository/WriteModelMemoryRepository";
import { allAlarmCountProjection, deviceAlarmCountProjection } from "./readModel/AlarmCountProjection";
import { DeviceService } from "./service/deviceService";
import { alarmProjectionHandler } from '.';


describe('deviceApplication', () => {
  // Setup Read Side
  const readModelRepo = new ReadModelMemoryRepository();
  const eventBus = (changes: Array<EntityEvent>) => {
    const projections = [
      alarmProjectionHandler,
      deviceAlarmCountProjection, 
      allAlarmCountProjection,
    ]
    projections.forEach(x => x(changes, readModelRepo))
  }

  // Setup Write side
  const deviceWriterepository = new WriteModelMemoryRepository()
  deviceWriterepository.subscribeToChanges(eventBus)
  const deviceservice = new DeviceService(deviceWriterepository)

  it('Updates entities and read models', async () => {
    // Perform actions
    const device1 = Uuid.createV4()
    const device1Alarms = [Uuid.createV4(), Uuid.createV4()]

    const device2 = Uuid.createV4()
    const device2Alarms = [Uuid.createV4(), Uuid.createV4(), Uuid.createV4(), Uuid.createV4()]

    await deviceservice.addNewDeviceToNetwork(device1)
    for (var id of device1Alarms) {
      await deviceservice.addDeviceAlarm(device1, id)
    }

    await deviceservice.addNewDeviceToNetwork(device2)
    for (var id of device2Alarms) {
      await deviceservice.addDeviceAlarm(device2, id)
    }

    await deviceservice.removeDeviceAlarm(device1, device1Alarms[0])
    readModelRepo.printAll()
  })

})