import {ExternalEvent} from "../eventSourcing/MessageTypes";
import {ExternalEventStoreProcessingState} from "./EventStoreExternal";

export interface ExternalEventStoreRepository {
    exists(eventId: string): Promise<boolean>

    append(externalEvent: ExternalEvent): Promise<void>

    markAsProcessed(eventId: string): Promise<void>

    recordProcessingFailure(eventId: string, state: ExternalEventStoreProcessingState): Promise<void>
}