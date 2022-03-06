import * as Uuid from "./UUID";
import {ChangeEvent, EntityEvent} from "./MessageTypes";

export interface Aggregate {
    readonly id: Uuid.UUID
    readonly changeVersion: number


    loadFromHistory(events: Array<EntityEvent>): void

    uncommittedChanges(): Array<EntityEvent>

    markChangesAsCommitted(version: number): void
}

export interface ParentAggregate {
    id(): Uuid.UUID,

    addChangeEvent(event: ChangeEvent): void
}