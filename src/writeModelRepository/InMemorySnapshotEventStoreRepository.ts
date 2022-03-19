import { UUID } from '../eventSourcing/UUID'
import { ChangeEvent, EntityEvent } from '../eventSourcing/MessageTypes'
import { SnapshotEventStoreRepository } from './SnapshotEventStoreRepository'

export class InMemorySnapshotEventStoreRepository implements SnapshotEventStoreRepository {
  constructor(private readonly snapShotStore = new Map<UUID, Array<EntityEvent>>()) {}

  async getSnapshotEvents(id: UUID): Promise<EntityEvent[]> {
    const snapshots = this.snapShotStore.get(id)
    return Array.isArray(snapshots) ? snapshots : []
  }

  async appendSnapshotEvents(id: UUID, snapshots: ChangeEvent[]): Promise<void> {
    this.snapShotStore.set(
      id,
      snapshots.map((x, i) => ({ event: x, version: i }))
    )
  }
}
