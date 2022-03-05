import {ExternalEvent} from "../EventSourcing/EventSourcingTypes";
import {ExternalEventStoreProcessingState, ExternalEventStoreRepository} from "./EventStoreExternal";

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

    async recordFailedProcessing(eventId: string, state: ExternalEventStoreProcessingState): Promise<void> {
        this.failed.set(eventId, state)
    }

    async setAsProcessed(eventId: string, retryCount: number = 0): Promise<void> {
        this.failed.delete(eventId)
        this.processed.set(eventId, retryCount)
    }
}

