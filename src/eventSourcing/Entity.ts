import * as Uuid from "./UUID";
import {ChangeEvent} from "./MessageTypes";
import {ParentAggregate} from "./Aggregate";

export interface Entity {
    readonly id: Uuid.UUID

    applyChangeEvent(event: ChangeEvent): void
}

export interface EntityConstructor<T extends Entity> {
    new(parent: ParentAggregate, id?: Uuid.UUID): T
}

export type StaticEventHandler<E> = (entity: E, evt: ChangeEvent) => void