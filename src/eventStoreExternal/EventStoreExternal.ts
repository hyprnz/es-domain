import {ExternalEvent} from "../eventSourcing/MessageTypes";
import {ExternalEventStoreRepository} from "./ExternalEventStoreRepository";
import {Logger, makeNoOpLogger} from "../eventSourcing/Logger";
import {EventBusExternal} from "../eventSourcing/EventBusExternal";

export enum ExternalEventStoreProcessingState {
    RECEIVED = 'RECEIVED',
    APPENDED = 'APPENDED',
    HANDLED = 'HANDLED',
    PROCESSED = 'PROCESSED',
}

// Used for idempotent processing of external events.
export class EventStoreExternal {
    private readonly eventBus = new EventBusExternal();
    private readonly failedEventBus = new EventBusExternal();

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
                await this.onAfterEventsStored([externalEvent])
                state = ExternalEventStoreProcessingState.HANDLED
            }
            state = ExternalEventStoreProcessingState.PROCESSED
        } catch (err) {
            // TODO: specific error with all info for logging
            this.logger.error(`External event store failed for id: ${externalEvent.id} with state: ${state}`)
            this.logger.error(err)
            await this.onAfterEventsFailed([externalEvent])
            this.logger.debug(`Handled failure for event id: ${externalEvent.id} with state: ${state}`)
        }
    }

    private async appendEvent(
        externalEvent: ExternalEvent,
    ): Promise<boolean> {
        const exists = await this.store.exists(externalEvent.eventId)
        if (!exists) {
            // Only handle if new - idempotent processing
            await this.store.appendEvent(externalEvent)
            return true
        }
        return false
    }

    subscribeToEventsSynchronously(handler: (events: ExternalEvent[]) => Promise<void>) {
        this.eventBus.registerHandlerForEvents(handler)
    }

    subscribeToFailureSynchronously(handler: (events: ExternalEvent[]) => Promise<void>) {
        this.failedEventBus.registerHandlerForEvents(handler)
    }

    private async onAfterEventsStored(events: ExternalEvent[]): Promise<void> {
        await this.eventBus.callHandlers(events)
    }

    private async onAfterEventsFailed(events: ExternalEvent[]): Promise<void> {
        await this.failedEventBus.callHandlers(events)
    }
}