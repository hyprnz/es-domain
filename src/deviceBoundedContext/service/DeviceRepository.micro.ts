import { assertThat, match } from 'mismatched'
import { EventStoreBuilder, Uuid } from '../..'
import { AggregateRootRepository, AggregateRootRepositoryFactory } from '../../eventSourcing/AggregateRootRepository'
import { SnapshotStrategyBuilder } from '../../eventSourcing/snapshotStrategyBuilder'
import { InMemoryEventStore } from '../../writeModelRepository/InMemoryEventStore'
import { InMemorySnapshotEventStore } from '../../writeModelRepository/InMemorySnapshotEventStore'
import { Device, DeviceCreationParmaters } from '../domain/Device'

describe('DeviceRepository', () => {
  let repository: AggregateRootRepository<Device, DeviceCreationParmaters>

  beforeEach(() => {
    const inMemoryEventStore = EventStoreBuilder.withRepository(new InMemoryEventStore()).make()

    const snapshotStrategy = SnapshotStrategyBuilder.afterCountOfEvents(100)
    const inMemorySnapshotStore = new InMemorySnapshotEventStore()

    repository = AggregateRootRepositoryFactory.makeSnapshotRepo(
      inMemoryEventStore,
      Device,
      inMemorySnapshotStore,
      snapshotStrategy
    )
  })

  describe('create', () => {
    const id = Uuid.createV4()
    it('new', async () => {
      const [newDevice] = await repository.create({ id, colour: 'red' })
      await newDevice.save()

      const [result] = await repository.get(id)
      assertThat(result).is(match.obj.has({ id, colour: 'red' }))
    })
  })

  describe('save', () => {
    const id = Uuid.createV4()
    const alarmId = Uuid.createV4()
    it('with a change that does not create a snapshot', async () => {
      const [newDevice] = await repository.create({ id, colour: 'red' })
      await newDevice.save()

      const [device, container] = await repository.get(id)
      device.addAlarm(alarmId)
      assertThat(container.uncommittedChanges()).is(match.array.length(1))
      await device.save()

      assertThat(container.uncommittedChanges()).is([])
    })
    it('with a change that creates a snapshot', async () => {
      const [newDevice] = await repository.create({ id, colour: 'red' })
      await newDevice.save()

      const [device, deviceContainer] = await repository.get(id)
      device.addAlarm(Uuid.createV4())
      device.addAlarm(Uuid.createV4())
      device.addAlarm(Uuid.createV4())
      await device.save()

      assertThat(device.id).is(id)
      assertThat(deviceContainer.changeVersion).is(3)
      assertThat(deviceContainer.uncommittedChanges()).is([])

      const [loadedDevice, loadedContainer] = await repository.get(id)
      assertThat(loadedDevice.id).is(id)
      assertThat(loadedContainer.changeVersion).is(3)
      assertThat(loadedContainer.uncommittedChanges()).is([])
    })
  })
})
