import * as Uuid from '../eventSourcing/UUID'
import { assertThat } from 'mismatched'
import { SnapshotRepository } from './SnapshotRepository'
import { InMemorySnapshotEventStore } from './InMemorySnapshotEventStore'
import { TestSnapshotableAggregate } from '../eventSourcing/TestAggregate'

describe('AggregateSnapshotRepository', () => {
  let repository: SnapshotRepository

  beforeEach(() => {
    repository = new SnapshotRepository(new InMemorySnapshotEventStore())
  })

  it('saveSnapshot', async () => {
    const id = Uuid.createV4()

    const aggregate = new TestSnapshotableAggregate()
    aggregate.createNewAggregateRoot({id})
    const countEvents = await repository.saveSnapshot(aggregate)

    assertThat(countEvents).is(1)
  })

  it('loadSnapshot', async () => {
    const id = Uuid.createV4()

    const aggregate = new TestSnapshotableAggregate()
    aggregate.createNewAggregateRoot({id})

    await repository.saveSnapshot(aggregate)
    const result = await repository.loadSnapshot(id, aggregate)

    assertThat(result.id).is(id)
    assertThat(result.uncommittedChanges()).is(aggregate.uncommittedChanges())
    assertThat(result.changeVersion).is(aggregate.changeVersion)
    assertThat(result.countOfEvents()).is(aggregate.countOfEvents())
  })
})
