import {UUID} from "../eventSourcing/UUID";
import {EntityEvent} from "../eventSourcing/MessageTypes";

export interface InternalEventStoreRepository {
    appendEvents(id: UUID, changeVersion: number, events: EntityEvent[]): Promise<void>

    getEvents(id: UUID): Promise<EntityEvent[]>
}