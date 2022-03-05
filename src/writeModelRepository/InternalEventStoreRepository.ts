import {UUID} from "../eventSourcing/UUID";
import {EntityEvent} from "../eventSourcing/MessageTypes";

export interface InternalEventStoreRepository {
    appendEvents(id: UUID, events: EntityEvent[]): Promise<void>

    getEvents(id: UUID): Promise<EntityEvent[]>
}