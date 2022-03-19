import { UUID } from '../eventSourcing/UUID'
import { SnapshotAggregate } from '../eventSourcing/Aggregate'
import { SnapshotWriteModelRepository } from './SnapshotWriteModelRepository'
import { InMemorySnapshotEventStoreRepository } from './InMemorySnapshotEventStoreRepository'

export class AggregateSnapshotRepository implements SnapshotWriteModelRepository {
  constructor(private readonly eventStore: InMemorySnapshotEventStoreRepository) {}

  async loadSnapshot<T extends SnapshotAggregate>(id: UUID, aggregate: T): Promise<T> {
    const events = await this.eventStore.getSnapshotEvents(id)
    aggregate.loadFromHistory(events)
    return aggregate
  }

  async saveSnapshot<T extends SnapshotAggregate>(aggregate: T): Promise<number> {
    const changes = aggregate.uncommittedSnapshots()
    await this.eventStore.appendSnapshotEvents(aggregate.id, changes)
    aggregate.markSnapshotAsCommitted()
    return changes.length
  }
}
