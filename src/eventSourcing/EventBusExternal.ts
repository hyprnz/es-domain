import {ExternalEvent} from "./MessageTypes";
import {EventBus, EventBusProcessor} from "./EventBus";

export class EventBusExternal implements EventBus<ExternalEvent> {
    constructor(private eventBusProcessor: EventBusProcessor<ExternalEvent> = new EventBusProcessor<ExternalEvent>()) {
    }

    async callHandlers<T extends ExternalEvent>(event: T): Promise<void> {
        return await this.eventBusProcessor.callHandlers(event.id, event.eventType, event.eventId, event)
    }

    registerHandlerForEvent<T extends ExternalEvent>(handler: (e: T) => Promise<unknown>): void {
        this.eventBusProcessor.registerHandlerForEvent(handler)
    }
}

