import { assertThat } from 'mismatched'
import { DeviceRepository } from './DeviceRepository'
import { AggregateRepository } from '../../writeModelRepository/AggregateRepository'
import { InMemoryEventStore } from '../../writeModelRepository/InMemoryEventStore'
import { AggregateSnapshotRepository } from '../../writeModelRepository/AggregateSnapshotRepository'
import { InMemorySnapshotEventStore } from '../../writeModelRepository/InMemorySnapshotEventStore'
import { Uuid } from '../..'
import { DomainRepository } from '../../writeModelRepository/DomainRepository'

describe('DeviceRepository', () => {
  let repository: DeviceRepository

  beforeEach(() => {
    const aggregateRepository = new AggregateRepository(new InMemoryEventStore())
    const aggregateSnapshotRepository = new AggregateSnapshotRepository(new InMemorySnapshotEventStore())
    repository = new DeviceRepository(new DomainRepository(aggregateRepository, aggregateSnapshotRepository))
  })

  describe('create', () => {
    const id = Uuid.createV4()
    it('new', async () => {
      await repository.create(id)
      const result = await repository.load(id)
      assertThat(result.id).is(id)
      assertThat(result.changeVersion).is(0)
    })
  })

  describe('save', () => {
    const id = Uuid.createV4()
    const alarmId = Uuid.createV4()
    it('with a change that does not create a snapshot', async () => {
      await repository.create(id)
      const aggregate = await repository.load(id)
      aggregate.addAlarm(alarmId)
      await repository.save(aggregate, 100)
      assertThat(aggregate.id).is(id)
      assertThat(aggregate.changeVersion).is(1)
      assertThat(aggregate.uncommittedChanges()).is([])
      assertThat(aggregate.uncommittedSnapshots()).is([])
    })
    it('with a change that creates a snapshot', async () => {
      await repository.create(id)
      const aggregate = await repository.load(id)
      aggregate.addAlarm(Uuid.createV4())
      aggregate.addAlarm(Uuid.createV4())
      aggregate.addAlarm(Uuid.createV4())
      await repository.save(aggregate, 1)
      assertThat(aggregate.id).is(id)
      assertThat(aggregate.countOfEvents()).is(4)
      assertThat(aggregate.changeVersion).is(3)
      assertThat(aggregate.uncommittedChanges()).is([])
      assertThat(aggregate.uncommittedSnapshots()).is([])
      const aggregateFromSnapshot = await repository.load(id)
      assertThat(aggregateFromSnapshot.id).is(id)
      assertThat(aggregateFromSnapshot.changeVersion).is(3)
      assertThat(aggregateFromSnapshot.uncommittedChanges()).is([])
      assertThat(aggregateFromSnapshot.uncommittedSnapshots()).is([])
    })
  })
})
