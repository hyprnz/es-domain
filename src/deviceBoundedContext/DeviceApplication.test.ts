import * as Uuid from '../eventSourcing/UUID'
import { EntityEvent } from '../eventSourcing/MessageTypes'
import { ReadModelMemoryRepository } from '../readModelRepository/ReadModelMemoryRepository'
import { AggregateRepository } from '../writeModelRepository/AggregateRepository'
import { allAlarmCountProjection, deviceAlarmCountProjection } from './readModel/AlarmCountProjection'
import { DeviceService } from './service/DeviceService'
import { alarmProjectionHandler } from '.'
import { InMemoryEventStoreRepository } from '../writeModelRepository/InMemoryEventStoreRepository'
import { DeviceRepository } from './service/DeviceRepository'
import {AggregateSnapshotRepository} from "../writeModelRepository/AggregateSnapshotRepository";
import {InMemorySnapshotEventStoreRepository} from "../writeModelRepository/InMemorySnapshotEventStoreRepository";

describe('deviceApplication', () => {
  // Setup Read Side
  const readModelRepo = new ReadModelMemoryRepository()
  const eventBus = async (changes: Array<EntityEvent>) => {
    const projections = [alarmProjectionHandler, deviceAlarmCountProjection, allAlarmCountProjection]
    projections.forEach(x => x(changes, readModelRepo))
  }

  // Setup Write side
  const aggregateRepository = new AggregateRepository(new InMemoryEventStoreRepository())
  const aggregateSnapshotRepository = new AggregateSnapshotRepository(new InMemorySnapshotEventStoreRepository())
  aggregateRepository.subscribeToChangesSynchronously(eventBus)
  const deviceService = new DeviceService(new DeviceRepository(aggregateRepository, aggregateSnapshotRepository))

  it('Updates entities and read models', async () => {
    // Perform actions
    const device1 = Uuid.createV4()
    const device1Alarms = [Uuid.createV4(), Uuid.createV4()]

    const device2 = Uuid.createV4()
    const device2Alarms = [Uuid.createV4(), Uuid.createV4(), Uuid.createV4(), Uuid.createV4()]

    await deviceService.addNewDeviceToNetwork(device1)
    for (const id of device1Alarms) {
      await deviceService.addDeviceAlarm(device1, id)
    }

    await deviceService.addNewDeviceToNetwork(device2)
    for (const id of device2Alarms) {
      await deviceService.addDeviceAlarm(device2, id)
    }

    await deviceService.removeDeviceAlarm(device1, device1Alarms[0])
    readModelRepo.printAll()
  })
})
