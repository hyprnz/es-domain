import * as Uuid from './UUID'

export const UNINITIALISED_AGGREGATE_VERSION = -1

export interface Message {
  readonly id: Uuid.UUID
  readonly correlationId: Uuid.UUID,
  readonly causationId: Uuid.UUID,
}
export interface ChangeEvent
{
    readonly id: Uuid.UUID
    readonly eventType: string
    readonly entityId: Uuid.UUID
    readonly aggregateRootId : Uuid.UUID
}

export interface EntityEvent
{
    version: number
    readonly event: ChangeEvent
}

export interface Aggregate {
  readonly id: Uuid.UUID
  readonly changeVersion: number
  

  loadFromHistory(events: Array<EntityEvent>): void
  uncommittedChanges(): Array<EntityEvent>
  markChangesAsCommitted(version: number): void
}

export interface Entity {
  readonly id: Uuid.UUID
  applyChangeEvent(event: ChangeEvent): void
}

export interface EntityContructor<T extends Entity>{
  new (parent: ParentAggregate, id?: Uuid.UUID): T
}
export interface ParentAggregate {
  id() : Uuid.UUID,
  addChangeEvent(event: ChangeEvent): void
}

export type StaticEventHandler<E> = (entity: E, evt: ChangeEvent) => void