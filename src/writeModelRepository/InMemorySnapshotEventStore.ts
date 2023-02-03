import { UUID } from '../util/UUID'
import { ChangeEvent, UNINITIALISED_AGGREGATE_VERSION } from '../eventSourcing/contracts/MessageTypes'
import { SnapshotEventStore } from '../eventSourcing/contracts/SnapshotEventStore'

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
      : this.makeEmptySnapshot(id)
  }

  async appendSnapshotEvents(id: UUID, changeVersion: number, snapshots: ChangeEvent[]): Promise<void> {
    this.snapShotStore.set(id, { id, snapshots, changeVersion })
  }

  private makeEmptySnapshot(id: string): AggregateSnapshot {
    return {
      id,
      snapshots: [],
      changeVersion: UNINITIALISED_AGGREGATE_VERSION
    }
  }


}
