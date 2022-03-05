import {EntityEvent} from "./MessageTypes";
import {EventBus, EventBusProcessor} from "./EventBus";

export class EventBusExternal implements EventBus<EntityEvent> {
    constructor(private eventBusProcessor: EventBusProcessor<EntityEvent>) {
    }

    async callHandlers<T extends EntityEvent>(event: T): Promise<void> {
        return await this.eventBusProcessor.callHandlers(event.event.id, event.event.eventType, event.event.id, event)
    }

    registerHandlerForEvent<T extends EntityEvent>(handler: (e: T) => Promise<unknown>): void {
        this.eventBusProcessor.registerHandlerForEvent(handler)
    }
}