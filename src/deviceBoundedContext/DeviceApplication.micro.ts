import * as Uuid from '../util/UUID'
import { EntityEvent } from '../eventSourcing/MessageTypes'
import { ReadModelMemoryRepository } from '../readModelRepository/ReadModelMemoryRepository'
import { AggregateRepository } from '../writeModelRepository/AggregateRepository'
import { allAlarmCountProjection, deviceAlarmCountProjection } from './readModel/AlarmCountProjection'
import { DeviceService } from './service/DeviceService'
import { alarmProjectionHandler } from '.'
import { InMemoryEventStore } from '../writeModelRepository/InMemoryEventStore'
import { DeviceRepository } from './service/DeviceRepository'
import { SnapshotRepository } from '../writeModelRepository/SnapshotRepository'
import { InMemorySnapshotEventStore } from '../writeModelRepository/InMemorySnapshotEventStore'
import { AggregateSnapshotRepository } from '../writeModelRepository/AggregateSnapshotRepository'

describe('deviceApplication', () => {
  // Setup Read Side
  const readModelRepo = new ReadModelMemoryRepository()
  const eventBus = async (changes: Array<EntityEvent>) => {
    const projections = [alarmProjectionHandler, deviceAlarmCountProjection, allAlarmCountProjection]
    projections.forEach(x => x(changes, readModelRepo))
  }

  // Setup Write side
  const aggregateRepository = new AggregateRepository(new InMemoryEventStore())
  const aggregateSnapshotRepository = new SnapshotRepository(new InMemorySnapshotEventStore())
  aggregateRepository.subscribeToChangesSynchronously(eventBus)
  const deviceService = new DeviceService(
    new DeviceRepository(new AggregateSnapshotRepository(aggregateRepository, aggregateSnapshotRepository))
  )

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
    // readModelRepo.printAll()
  })
})
