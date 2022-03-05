import {ExternalEvent} from "../EventSourcing/EventSourcingTypes";

export interface ExternalEventStoreRepository {
    exists(eventId: string): Promise<boolean>

    append(externalEvent: ExternalEvent): Promise<void>

    setAsProcessed(eventId: string): Promise<void>

    recordFailedProcessing(eventId: string, state: ExternalEventStoreProcessingState): Promise<void>
}

export enum ExternalEventStoreProcessingState {
    RECEIVED = 'RECEIVED',
    APPENDED = 'APPENDED',
    HANDLED = 'HANDLED',
    COMPLETED = 'COMPLETED',
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
                await this.store.setAsProcessed(externalEvent.eventId)
            }
            state = ExternalEventStoreProcessingState.COMPLETED
        } catch (err) {
            // console.log(err)
            await this.store.recordFailedProcessing(externalEvent.eventId, state)
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