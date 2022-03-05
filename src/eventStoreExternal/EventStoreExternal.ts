import {ExternalEvent} from "../eventSourcing/MessageTypes";
import {ExternalEventStoreRepository} from "./ExternalEventStoreRepository";
import {Logger, makeNoOpLogger} from "../eventSourcing/Logger";
import {EventBus} from "../eventSourcing/EventBus";

const EXTERNAL_EVENT = 'event'
const EVENT_FAILED = 'failed'

export enum ExternalEventStoreProcessingState {
    RECEIVED = 'RECEIVED',
    APPENDED = 'APPENDED',
    HANDLED = 'HANDLED',
    PROCESSED = 'PROCESSED',
}

// Used for idempotent processing of external events.
export class EventStoreExternal {
    private readonly eventBus = new EventBus();
    private readonly failedEventBus = new EventBus();

    constructor(private store: ExternalEventStoreRepository, private readonly logger: Logger = makeNoOpLogger()) {
    }

    async process(
        externalEvent: ExternalEvent
    ): Promise<void> {
        let state = ExternalEventStoreProcessingState.RECEIVED
        try {
            const appended = await this.appendEvent(externalEvent)
            if (appended) {
                state = ExternalEventStoreProcessingState.APPENDED
                await this.onAfterEventStored(externalEvent)
                state = ExternalEventStoreProcessingState.HANDLED
            }
            state = ExternalEventStoreProcessingState.PROCESSED
        } catch (err) {
            // TODO: specific error with all info for logging
            this.logger.error(`External event store failed for id: ${externalEvent.id} with state: ${state}`)
            this.logger.error(err)
            await this.onAfterEventFailed(externalEvent)
            this.logger.debug(`Handled failure for event id: ${externalEvent.id} with state: ${state}`)
        }
    }

    private async appendEvent(
        externalEvent: ExternalEvent,
    ): Promise<boolean> {
        const exists = await this.store.exists(externalEvent.eventId)
        if (!exists) {
            // Only handle if new - idempotent processing
            await this.store.append(externalEvent)
            return true
        }
        return false
    }

    subscribeToEventSynchronously(eventType: string, handler: (event: ExternalEvent) => Promise<void>) {
        this.eventBus.registerHandlerForEvent(eventType, handler)
    }

    subscribeToFailureSynchronously(eventType: string, handler: (event: ExternalEvent) => Promise<void>) {
        this.failedEventBus.registerHandlerForEvent(eventType, handler)
    }

    private async onAfterEventStored(event: ExternalEvent): Promise<void> {
        await this.eventBus.callHandlers(event)
    }

    private async onAfterEventFailed(event: ExternalEvent): Promise<void> {
        await this.failedEventBus.callHandlers(event)
    }
}