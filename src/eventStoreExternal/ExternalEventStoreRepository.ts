import {ExternalEvent} from "../eventSourcing/MessageTypes";

export interface ExternalEventStoreRepository {
    exists(eventId: string): Promise<boolean>

    append(externalEvent: ExternalEvent): Promise<void>
}