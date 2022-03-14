import * as Uuid from "./UUID";
import {ChangeEvent} from "./MessageTypes";
import {Parent, ChangeObserver} from "./Aggregate";

export interface Entity {
    readonly id: Uuid.UUID

    applyChangeEvent(event: ChangeEvent): void
}

export interface EventSourcedEntity {
    readonly id: Uuid.UUID
    readonly aggregate: Parent
}

export interface EntityConstructor<T extends Entity> {
    new(parent: ChangeObserver, id?: Uuid.UUID): T
}

export type StaticEventHandler<E> = (entity: E, evt: ChangeEvent) => void