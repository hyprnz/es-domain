import {ExternalEvent} from "../eventSourcing/MessageTypes";
import {ExternalEventStoreProcessingState} from "./EventStoreExternal";
import {ExternalEventStoreRepository} from "./ExternalEventStoreRepository";

export class ExternalEventStoreInMemoryRepository implements ExternalEventStoreRepository {
    private readonly store = new Map<string, ExternalEvent>()
    private readonly processed = new Map<string, number>()
    private failed = new Map<string, ExternalEventStoreProcessingState>()

    async append(externalEvent: ExternalEvent): Promise<void> {
        this.store.set(externalEvent.eventId, externalEvent)
    }

    async exists(eventId: string): Promise<boolean> {
        return this.store.has(eventId)
    }

    async recordProcessingFailure(eventId: string, state: ExternalEventStoreProcessingState): Promise<void> {
        this.failed.set(eventId, state)
    }

    async markAsProcessed(eventId: string, retryCount: number = 0): Promise<void> {
        this.failed.delete(eventId)
        this.processed.set(eventId, retryCount)
    }
}

