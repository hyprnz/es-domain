import { alarmProjectionHandler, Device } from '.'
import { EventBusProducer } from '../eventBus/EventBusProcessor'
import { AggregateRootRepositoryBuilder } from '../eventSourcing/AggregateRootRepository'
import { EntityEvent } from '../eventSourcing/contracts/MessageTypes'
import { SnapshotStrategyBuilder } from '../eventSourcing/snapshotStrategyBuilder'
import { ReadModelMemoryRepository } from '../readModelRepository/ReadModelMemoryRepository'
import * as Uuid from '../util/UUID'
import { InMemoryEventStore } from '../writeModelRepository/InMemoryEventStore'
import { InMemorySnapshotEventStore } from '../writeModelRepository/InMemorySnapshotEventStore'
import { allAlarmCountProjection, deviceAlarmCountProjection } from './readModel/AlarmCountProjection'
import { DeviceService } from './service/DeviceService'

describe('deviceApplication', () => {
  // Setup Read Side
  const readModelRepo = new ReadModelMemoryRepository()
  const eventBus = async (changes: Array<EntityEvent>) => {
    const projections = [alarmProjectionHandler, deviceAlarmCountProjection, allAlarmCountProjection]
    projections.forEach(x => x(changes, readModelRepo))
  }

  // Setup Write side
  const eventStore = AggregateRootRepositoryBuilder.makeEventStore(
    new InMemoryEventStore(),
    new EventBusProducer()
  ).registerCallback(eventBus)

  const inMemoryEventStore = AggregateRootRepositoryBuilder.makeEventStore(new InMemoryEventStore(), new EventBusProducer())
  const inMemorySnapshotStore = new InMemorySnapshotEventStore()
  const snapshotStrategy = SnapshotStrategyBuilder.afterCountOfEvents(100)
  const repository = AggregateRootRepositoryBuilder.makeSnapshotRepo(
    inMemoryEventStore,
    Device,
    inMemorySnapshotStore,
    snapshotStrategy
  )

  const deviceService = new DeviceService(repository)

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
