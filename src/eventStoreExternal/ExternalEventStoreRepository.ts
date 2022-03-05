import {ExternalEvent} from "../eventSourcing/MessageTypes";

export interface ExternalEventStoreRepository {
    exists(eventId: string): Promise<boolean>
    appendEvent(externalEvent: ExternalEvent): Promise<void>
}