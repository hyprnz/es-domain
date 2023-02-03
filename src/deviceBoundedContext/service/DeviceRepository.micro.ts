import { assertThat, match } from 'mismatched'
import { InMemoryEventStore } from '../../writeModelRepository/InMemoryEventStore'
import { InMemorySnapshotEventStore } from '../../writeModelRepository/InMemorySnapshotEventStore'
import { Uuid } from '../..'
import { EventBusProducer } from '../../eventBus/EventBusProcessor'
import { AggregateRepository, AggregateRootRepositoryBuilder } from '../../eventSourcing/AggregateRootRepo'
import { Device, DeviceCreationParmaters } from '../domain/Device'

describe('DeviceRepository', () => {
  let repository: AggregateRepository<Device, DeviceCreationParmaters>

  beforeEach(() => {
    const inMemoryEventStore = AggregateRootRepositoryBuilder.makeEventStore(new InMemoryEventStore(), new EventBusProducer())
    const inMemorySnapshotStore = new InMemorySnapshotEventStore()
    repository = AggregateRootRepositoryBuilder.makeSnapshotRepo(inMemoryEventStore, Device, inMemorySnapshotStore)
  })

  describe('create', () => {
    const id = Uuid.createV4()
    it('new', async () => {
      const [newDevice] = await repository.create({id, colour:"red"})
      await newDevice.save()

      const [result] = await repository.get(id)
      assertThat(result).is(match.obj.has({id, colour:"red"}))
    })
  })

  describe('save', () => {
    const id = Uuid.createV4()
    const alarmId = Uuid.createV4()
    it('with a change that does not create a snapshot', async () => {
      const [newDevice] = await repository.create({id, colour:"red"})
      await newDevice.save()

      const [device, container] = await repository.get(id)
      device.addAlarm(alarmId)
      assertThat(container.uncommittedChanges()).is(match.array.length(1))
      await device.save()

      assertThat(container.uncommittedChanges()).is([])
    })
    it('with a change that creates a snapshot', async () => {
      const [newDevice] = await repository.create({id, colour:"red"})
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
