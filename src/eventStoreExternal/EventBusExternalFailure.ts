import {EventBusProcessor} from "../eventSourcing/EventBus";
import {ExternalEventStoreProcessingState} from "./EventStoreExternal";
import {UUID} from "../eventSourcing/UUID";

export interface EventFailed {
    id: UUID,
    eventId: string,
    eventType: string,
    state: ExternalEventStoreProcessingState
}

export class EventBusEventFailed {
    constructor(private eventBusProcessor: EventBusProcessor<EventFailed> = new EventBusProcessor<EventFailed>()) {
    }

    async callHandlers(event: EventFailed): Promise<void> {
        await this.eventBusProcessor.callHandlers(event.id, event.eventType, event.eventId, event)
    }

    registerHandlerForEvents(handler: (events: EventFailed[]) => Promise<unknown>): void {
        this.eventBusProcessor.registerHandlerForEvent(handler)
    }
}

