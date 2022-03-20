import * as Uuid from '../eventSourcing/UUID'
import { assertThat } from 'mismatched'
import { InMemorySnapshotEventStore } from './InMemorySnapshotEventStore'
import { ChangeEventBuilder } from '../eventSourcing/ChangeEventBuilder'

describe('InMemorySnapshotEventStoreRepository', () => {
  let repository: InMemorySnapshotEventStore

  beforeEach(() => {
    repository = new InMemorySnapshotEventStore()
  })

  it('getAggregateSnapshot', async () => {
    const aggregateRootId = Uuid.createV4()

    const changeEvent = ChangeEventBuilder.make().withAggregateRootId(aggregateRootId).to()

    await repository.appendSnapshotEvents(aggregateRootId, 100, [changeEvent])
    const results = await repository.getAggregateSnapshot(aggregateRootId)

    assertThat(results.id).is(aggregateRootId)
    assertThat(results.changeVersion).is(100)
    assertThat(results.snapshots).is([changeEvent])
  })
})
