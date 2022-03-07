import {ExternalEvent} from "../eventSourcing/MessageTypes";
import {EventBus, EventBusProcessor} from "../eventSourcing/EventBus";
import {ExternalEventStoreProcessingState} from "./EventStoreExternal";

export interface FailedExternalEvent extends ExternalEvent {
    processingState: ExternalEventStoreProcessingState
}

export class EventBusExternal implements EventBus<ExternalEvent> {
    constructor(private eventBusProcessor: EventBusProcessor<ExternalEvent> = new EventBusProcessor<ExternalEvent>()) {
    }

    async callHandlers<T extends ExternalEvent>(events: T[]): Promise<void> {
        await this.eventBusProcessor.callHandlers(events)
    }

    registerHandlerForEvents<T extends ExternalEvent>(handler: (events: T[]) => Promise<unknown>): void {
        this.eventBusProcessor.registerHandlerForEvents(handler)
    }
}

