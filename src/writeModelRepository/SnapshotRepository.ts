import { UUID } from '../eventSourcing/UUID'
import { SnapshotAggregate } from '../eventSourcing/Aggregate'
import { WriteModelSnapshotRepository } from './WriteModelSnapshotRepository'
import { SnapshotEventStore } from './SnapshotEventStore'

export class SnapshotRepository implements WriteModelSnapshotRepository {
  constructor(private readonly eventStore: SnapshotEventStore) {}

  async loadSnapshot<T extends SnapshotAggregate>(id: UUID, aggregate: T): Promise<T> {
    const aggregateSnapshot = await this.eventStore.getAggregateSnapshot(id)
    aggregate.loadFromVersion(aggregateSnapshot.snapshots, aggregateSnapshot.changeVersion)
    return aggregate
  }

  async saveSnapshot<T extends SnapshotAggregate>(aggregate: T): Promise<number> {
    aggregate.snapshot()
    const changes = aggregate.uncommittedSnapshots()
    await this.eventStore.appendSnapshotEvents(aggregate.id, aggregate.changeVersion, changes)
    aggregate.markSnapshotsAsCommitted()
    return changes.length
  }
}
