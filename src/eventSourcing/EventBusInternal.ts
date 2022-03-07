import {ChangeEvent, EntityEvent} from "./MessageTypes";
import {EventBus, EventBusProcessor} from "./EventBus";

export class EventBusInternal implements EventBus<EntityEvent> {
    constructor(private eventBusProcessor: EventBusProcessor<EntityEvent> = new EventBusProcessor<EntityEvent>()) {
    }

    async callHandlers<T extends EntityEvent>(events: T[]): Promise<void> {
        await this.eventBusProcessor.callHandlers(events)
    }

    registerHandlerForEvents<T extends EntityEvent>(handler: (e: T[]) => Promise<unknown>): void {
        this.eventBusProcessor.registerHandlerForEvents(handler)
    }
}