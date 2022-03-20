import * as Uuid from '../eventSourcing/UUID'
import { assertThat } from 'mismatched'
import { SnapshotRepository } from './SnapshotRepository'
import { InMemorySnapshotEventStore } from './InMemorySnapshotEventStore'
import { TestAggregate } from '../eventSourcing/TestAggregate'

describe('AggregateSnapshotRepository', () => {
  const eventType = 'some-event-type'
  const causationId = Uuid.createV4()
  const correlationId = Uuid.createV4()

  let repository: SnapshotRepository

  beforeEach(() => {
    repository = new SnapshotRepository(new InMemorySnapshotEventStore())
  })

  it('saveSnapshot', async () => {
    const id = Uuid.createV4()

    const aggregate = new TestAggregate().withRoot(id)

    const countEvents = await repository.saveSnapshot(aggregate)

    assertThat(countEvents).is(1)
  })

  it('loadSnapshot', async () => {
    const id = Uuid.createV4()

    const aggregate = new TestAggregate().withRoot(id)

    await repository.saveSnapshot(aggregate)
    const result = await repository.loadSnapshot(id, aggregate)

    assertThat(result.id).is(id)
    assertThat(result.uncommittedSnapshots()).is([])
    assertThat(result.uncommittedChanges()).is(aggregate.uncommittedChanges())
    assertThat(result.changeVersion).is(aggregate.changeVersion)
    assertThat(result.countOfEvents()).is(aggregate.countOfEvents())
  })
})
