import {InternalEventStoreRepository} from "./InternalEventStoreRepository";
import {UUID} from "../eventSourcing/UUID";
import {EntityEvent} from "../eventSourcing/MessageTypes";

export class InMemoryEventStoreRepository implements InternalEventStoreRepository {
    private readonly store = new Map<UUID, Array<EntityEvent>>()

    async appendEvents(id: UUID, events: EntityEvent[]): Promise<void> {
        this.store.set(id, events)
    }

    async getEvents(id: UUID): Promise<EntityEvent[]> {
        const events = this.store.get(id)
        return Array.isArray(events) ? events : []
    }
}