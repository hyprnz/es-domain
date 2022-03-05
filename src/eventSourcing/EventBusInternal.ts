import {EntityEvent} from "./MessageTypes";
import {EventBus, EventBusProcessor} from "./EventBus";

export class EventBusInternal implements EventBus<EntityEvent> {
    constructor(private eventBusProcessor: EventBusProcessor<EntityEvent> = new EventBusProcessor<EntityEvent>()) {
    }

    async callHandlers<T extends EntityEvent>(events: T[]): Promise<void> {
        for (const event of events) {
            await this.eventBusProcessor.callHandlers(event.event.id, event.event.eventType, event.event.id, event)
        }
    }

    registerHandlerForEvents<T extends EntityEvent>(handler: (e: T[]) => Promise<unknown>): void {
        this.eventBusProcessor.registerHandlerForEvent(handler)
    }
}