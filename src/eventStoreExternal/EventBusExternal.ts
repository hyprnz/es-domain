import {ExternalEvent} from "../eventSourcing/MessageTypes";
import {EventBus, EventBusProcessor} from "../eventSourcing/EventBus";

export class EventBusExternal implements EventBus<ExternalEvent> {
    constructor(private eventBusProcessor: EventBusProcessor<ExternalEvent> = new EventBusProcessor<ExternalEvent>()) {
    }

    async callHandlers<T extends ExternalEvent>(events: T[]): Promise<void> {
        for (const event of events) {
            await this.eventBusProcessor.callHandlers(event.id, event.eventType, event.eventId, event)
        }
    }

    registerHandlerForEvents<T extends ExternalEvent>(handler: (events: T[]) => Promise<unknown>): void {
        this.eventBusProcessor.registerHandlerForEvent(handler)
    }
}

