import {InternalEventStoreRepository, SnapshotEventStoreRepository} from "./InternalEventStoreRepository";
import {UUID} from "../eventSourcing/UUID";
import {EntityEvent} from "../eventSourcing/MessageTypes";
import {OptimisticConcurrencyError} from "./OptimisticConcurrencyError";

export class InMemoryEventStoreRepository implements InternalEventStoreRepository, SnapshotEventStoreRepository {
    private readonly store = new Map<UUID, Array<EntityEvent>>()

    getEventsFromDate(id: UUID, fromDate: string): Promise<EntityEvent[]> {
        return this.getEvents(id).then(events => events
            .filter(x => new Date(x.event.dateTimeOfEvent).getTime() >= new Date(fromDate).getTime())
        )
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