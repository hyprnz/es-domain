import { InternalEventStoreRepository } from './InternalEventStoreRepository'
import { UUID } from '../eventSourcing/UUID'
import { EntityEvent } from '../eventSourcing/MessageTypes'
import { OptimisticConcurrencyError } from './OptimisticConcurrencyError'
import { SnapshotEventStoreRepository } from './SnapshotEventStoreRepository'

export class InMemoryEventStoreRepository implements InternalEventStoreRepository, SnapshotEventStoreRepository {
  constructor(private readonly store = new Map<UUID, Array<EntityEvent>>(), private readonly snapShotStore = new Map<UUID, Array<EntityEvent>>()) {}

  async getSnapshotEvents(id: UUID): Promise<EntityEvent[]> {
    const snapshots = this.snapShotStore.get(id)
    return Array.isArray(snapshots) ? snapshots : []
  }

  async appendSnapshotEvents(id: UUID, snapshots: EntityEvent[]): Promise<void> {
    this.snapShotStore.set(id, snapshots)
  }

  getEventsFromDate(id: UUID, fromDate: string): Promise<EntityEvent[]> {
    return this.getEvents(id).then(events => events.filter(x => new Date(x.event.dateTimeOfEvent).getTime() >= new Date(fromDate).getTime()))
  }

  async appendEvents(id: UUID, version: number, changes: EntityEvent[]): Promise<void> {
    const committedEvents = await this.getEvents(id)
    const found = committedEvents.length > 0
    if (found) {
      const committedVersion = committedEvents[committedEvents.length - 1].version + 1
      if (committedVersion !== version) {
        return Promise.reject(new OptimisticConcurrencyError(id, version))
      }
    }
    this.store.set(id, [...committedEvents, ...changes])
  }

  async getEvents(id: UUID): Promise<EntityEvent[]> {
    const events = this.store.get(id)
    return Array.isArray(events) ? events : []
  }
}
