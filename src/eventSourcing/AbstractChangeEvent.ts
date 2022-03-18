import * as Uuid from './UUID'
import {ChangeEvent} from "./MessageTypes";

/* @deprecated use discriminated type instead */
export abstract class AbstractChangeEvent implements ChangeEvent {
    readonly id: Uuid.UUID;
    readonly correlationId: Uuid.UUID;
    readonly causationId: Uuid.UUID;
    readonly payload: Record<string, any> = {};

    protected constructor(public eventType: string, public readonly aggregateRootId: Uuid.UUID, public readonly entityId: Uuid.UUID, public dateTimeOfEvent = new Date().toISOString()) {
        this.id = Uuid.createV4()
        this.correlationId = Uuid.createV4()
        this.causationId = Uuid.createV4()
    }
}

export type ChangeEventConstructor<E extends AbstractChangeEvent> = {
    eventType: string

    new(
        aggregateRootId: Uuid.UUID,
        entityId: Uuid.UUID,
        payload: E["payload"]
    ): E
}
