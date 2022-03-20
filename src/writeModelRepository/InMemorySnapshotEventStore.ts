import { UUID } from '../eventSourcing/UUID'
import { ChangeEvent, UNINITIALISED_AGGREGATE_VERSION } from '../eventSourcing/MessageTypes'
import { SnapshotEventStore } from './SnapshotEventStore'

export interface AggregateSnapshot {
  id: UUID
  snapshots: ChangeEvent[]
  changeVersion: number
}

export class InMemorySnapshotEventStore implements SnapshotEventStore {
  constructor(private readonly snapShotStore = new Map<UUID, AggregateSnapshot>()) {}

  async getAggregateSnapshot(id: UUID): Promise<AggregateSnapshot> {
    const aggregateSnapshot = this.snapShotStore.get(id)
    return aggregateSnapshot
      ? aggregateSnapshot
      : {
          id,
          snapshots: [],
          changeVersion: UNINITIALISED_AGGREGATE_VERSION
        }
  }

  async appendSnapshotEvents(id: UUID, changeVersion: number, snapshots: ChangeEvent[]): Promise<void> {
    this.snapShotStore.set(id, { id, snapshots, changeVersion })
  }
}
