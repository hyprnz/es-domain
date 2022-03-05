
import * as Uuid from '../eventSourcing/UUID'
import { EntityEvent } from "../eventSourcing/MessageTypes";
import { ReadModelMemoryRepository } from "../readModelRepository/ReadModelMemoryRepository";
import { AggregateEntityRepository } from "../writeModelRepository/AggregateEntityRepository";
import { allAlarmCountProjection, deviceAlarmCountProjection } from "./readModel/AlarmCountProjection";
import { DeviceService } from "./service/DeviceService";
import { alarmProjectionHandler } from '.';
import {InMemoryEventStoreRepository} from "../writeModelRepository/InMemoryEventStoreRepository";


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
  const deviceWriteRepository = new AggregateEntityRepository(new InMemoryEventStoreRepository())
  deviceWriteRepository.subscribeToChanges(eventBus)
  const deviceService = new DeviceService(deviceWriteRepository)

  it('Updates entities and read models', async () => {
    // Perform actions
    const device1 = Uuid.createV4()
    const device1Alarms = [Uuid.createV4(), Uuid.createV4()]

    const device2 = Uuid.createV4()
    const device2Alarms = [Uuid.createV4(), Uuid.createV4(), Uuid.createV4(), Uuid.createV4()]

    await deviceService.addNewDeviceToNetwork(device1)
    for (var id of device1Alarms) {
      await deviceService.addDeviceAlarm(device1, id)
    }

    await deviceService.addNewDeviceToNetwork(device2)
    for (var id of device2Alarms) {
      await deviceService.addDeviceAlarm(device2, id)
    }

    await deviceService.removeDeviceAlarm(device1, device1Alarms[0])
    readModelRepo.printAll()
  })

})