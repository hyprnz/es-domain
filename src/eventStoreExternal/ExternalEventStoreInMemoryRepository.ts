import {ExternalEvent} from "../eventSourcing/MessageTypes";
import {ExternalEventStoreRepository} from "./ExternalEventStoreRepository";
import {OptimisticConcurrencyError} from "../writeModelRepository/OptimisticConcurrencyError";

export class ExternalEventStoreInMemoryRepository implements ExternalEventStoreRepository {
    private readonly store = new Map<string, ExternalEvent>()

    async appendEvent(externalEvent: ExternalEvent): Promise<void> {
        if (await this.exists(externalEvent.eventId)) {
            throw new OptimisticConcurrencyError(externalEvent.id, externalEvent.eventId)
        }
        this.store.set(externalEvent.eventId, externalEvent)
    }

    private async exists(eventId: string): Promise<boolean> {
        return this.store.has(eventId)
    }
}

