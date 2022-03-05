import {ExternalEvent} from "../eventSourcing/MessageTypes";
import {ExternalEventStoreRepository} from "./ExternalEventStoreRepository";

export class ExternalEventStoreInMemoryRepository implements ExternalEventStoreRepository {
    private readonly store = new Map<string, ExternalEvent>()

    async appendEvent(externalEvent: ExternalEvent): Promise<void> {
        this.store.set(externalEvent.eventId, externalEvent)
    }

    async exists(eventId: string): Promise<boolean> {
        return this.store.has(eventId)
    }
}

