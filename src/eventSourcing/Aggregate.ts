import * as Uuid from "./UUID";
import {ChangeEvent, EntityEvent} from "./MessageTypes";
import {EventSourcedEntity} from "./Entity";

export interface Aggregate {
    readonly id: Uuid.UUID
    readonly changeVersion: number


    loadFromHistory(events: Array<EntityEvent>): void

    uncommittedChanges(): Array<EntityEvent>

    markChangesAsCommitted(version: number): void
}

export type EntityChangedObserver = (event: ChangeEvent) => void

export interface Parent {
    id(): Uuid.UUID,

    addChangeEvent(event: ChangeEvent): void

    registerEntity(entity: EventSourcedEntity): void
}
