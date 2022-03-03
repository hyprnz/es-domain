import { createV4, UUID } from './UUID'

export const UNINITIALISED_AGGREGATE_VERSION = -1

export interface Entity {
  id: UUID,
  aggregate: ParentAggregate
}

export interface ParentAggregate {
  id() : UUID,
  addChangeEvent(event: ChangeEvent): void,
  registerChildEntity(entity: Entity): void
}

export interface Aggregate {
  readonly id: UUID

  loadFromHistory(events: Array<EntityEvent>): void
  uncommittedChanges(): Array<EntityEvent>
  markChangesAsCommitted(): void
}

export interface Payload {
  [key: string]: any
}

export interface ChangeEvent {
    readonly id: UUID
    readonly eventType: string
    readonly entityId: UUID
    readonly aggregateRootId : UUID
    readonly payload: Payload
}

export interface EntityEvent {
    version: number
    readonly event: ChangeEvent
}

export type StaticEventHandler<E> = (entity: E, evt: ChangeEvent) => void

export type ChangeEventConstructor<E extends AbstractChangeEvent> = {
    eventType: string

    new (
        aggregateRootId: UUID,
        entityId: UUID,
        payload: E["payload"]
    ): E
}

export abstract class AbstractChangeEvent implements ChangeEvent {
  readonly id: UUID;
  readonly payload = {};
  constructor(
    readonly eventType: string,
    readonly aggregateRootId: UUID,
    readonly entityId: UUID
    ) {
    this.id = createV4()
    this.eventType = eventType
  }
}