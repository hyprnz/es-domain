import { UUID } from '../util/UUID'
import { EntityEvent } from '../eventSourcing/contracts/MessageTypes'
import { EventStoreRepository } from '../eventSourcing/contracts/EventStoreRepository'
import { OptimisticConcurrencyError } from '../eventSourcing/contracts/OptimisticConcurrencyError'

export class InMemoryEventStore implements EventStoreRepository {
  constructor(private readonly store = new Map<UUID, Array<EntityEvent>>()) {}

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

  async getEventsAfterVersion(id: UUID, version: number): Promise<EntityEvent[]> {
    return this.getEvents(id).then(events => events.filter(x => x.version > version))
  }
}
