import { UUID } from '../eventSourcing/UUID'
import { SnapshotAggregate } from '../eventSourcing/Aggregate'
import { SnapshotWriteModelRepository } from './SnapshotWriteModelRepository'
import { InMemorySnapshotEventStoreRepository } from './InMemorySnapshotEventStoreRepository'

export class AggregateSnapshotRepository implements SnapshotWriteModelRepository {
  constructor(private readonly eventStore: InMemorySnapshotEventStoreRepository) {}

  async loadSnapshot<T extends SnapshotAggregate>(id: UUID, aggregate: T): Promise<T> {
    const aggregateSnapshot = await this.eventStore.getAggregateSnapshot(id)
    aggregate.loadFromChangeEventsWithVersion(aggregateSnapshot.snapshots, aggregateSnapshot.changeVersion)
    return aggregate
  }

  async saveSnapshot<T extends SnapshotAggregate>(aggregate: T): Promise<number> {
    aggregate.snapshot()
    const changes = aggregate.uncommittedSnapshots()
    await this.eventStore.appendSnapshotEvents(aggregate.id, aggregate.changeVersion, changes)
    aggregate.markSnapshotAsCommitted()
    return changes.length
  }
}
