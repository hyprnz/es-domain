import {EntityEvent, ExternalEvent} from "../eventSourcing/MessageTypes";
import {ExternalEventStoreProcessingState} from "./EventStoreExternal";
import {ExternalEventStoreRepository} from "./ExternalEventStoreRepository";
import EventEmitter from "events";

const EVENTS = "events"

export class ExternalEventStoreInMemoryRepository implements ExternalEventStoreRepository {
    private readonly eventEmitter = new EventEmitter();
    private readonly store = new Map<string, ExternalEvent>()
    private readonly processed = new Map<string, number>()
    private failed = new Map<string, ExternalEventStoreProcessingState>()

    async appendEvent(externalEvent: ExternalEvent): Promise<void> {
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

    subscribeToChanges(handler: (changes: Array<EntityEvent>) => void) {
        this.eventEmitter.addListener(EVENTS, handler)
    }

    private onAfterEventsStored(changes: Array<EntityEvent>) {
        if (changes.length) {
            this.eventEmitter.emit(EVENTS, changes)
        }
    }
}

