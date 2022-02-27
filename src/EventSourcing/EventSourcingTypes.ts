import * as Uuid from './UUID'

export interface Delta {
  [key: string]: any
}

export const UNINITIALISED_AGGREGATE_VERSION = -1
export interface ChangeEvent
{
    readonly id: Uuid.UUID
    readonly eventType: string
    readonly entityId: Uuid.UUID
    readonly aggregateRootId : Uuid.UUID
    readonly delta: Delta
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


export interface ParentAggregate {
  id() : Uuid.UUID,
  addChangeEvent(event: ChangeEvent): void
}

export type StaticEventHandler<E> = (entity: E, evt: ChangeEvent) => void