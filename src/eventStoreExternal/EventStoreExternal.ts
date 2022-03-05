import {ExternalEvent} from "../eventSourcing/MessageTypes";
import {ExternalEventStoreRepository} from "./ExternalEventStoreRepository";

export enum ExternalEventStoreProcessingState {
    RECEIVED = 'RECEIVED',
    APPENDED = 'APPENDED',
    HANDLED = 'HANDLED',
    PROCESSED = 'PROCESSED',
}

export class EventStoreExternal {
    constructor(private store: ExternalEventStoreRepository) {
    }

    async process(
        externalEvent: ExternalEvent,
        handler: (e: ExternalEvent) => Promise<unknown>
    ): Promise<void> {
        let state = ExternalEventStoreProcessingState.RECEIVED
        try {
            const appended = await this.appendEvent(externalEvent)
            if (appended) {
                state = ExternalEventStoreProcessingState.APPENDED
                await handler(externalEvent)
                state = ExternalEventStoreProcessingState.HANDLED
                await this.store.markAsProcessed(externalEvent.eventId)
            }
            state = ExternalEventStoreProcessingState.PROCESSED
        } catch (err) {
            // console.log(err)
            await this.store.recordProcessingFailure(externalEvent.eventId, state)
        }
    }

    private async appendEvent(
        externalEvent: ExternalEvent,
    ): Promise<boolean> {
        const exists = await this.store.exists(externalEvent.eventId)
        if (!exists) {
            // Only handle if new - idempotent processing
            await this.store.append(externalEvent)
        }
        return exists
    }
}