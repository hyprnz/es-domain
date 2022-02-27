import { UUID } from './UUID'

export interface Delta {
  [key: string]: any
}

export interface DomainObject {
    id: UUID,
    aggregate: ParentAggregate
}

export const UNINITIALISED_AGGREGATE_VERSION = -1
export interface ChangeEvent
{
    readonly id: UUID
    readonly eventType: string
    readonly entityId: UUID
    readonly aggregateRootId : UUID
    readonly delta: Delta
}

export interface EntityEvent
{
    version: number
    readonly event: ChangeEvent
}

export interface Aggregate {
  readonly id: UUID
  readonly changeVersion: number
  

  loadFromHistory(events: Array<EntityEvent>): void
  uncommittedChanges(): Array<EntityEvent>
  markChangesAsCommitted(version: number): void
}

export interface Entity {
  readonly id: UUID
  applyChangeEvent(event: ChangeEvent): void
}


export interface ParentAggregate {
  id() : UUID,
  addChangeEvent(event: ChangeEvent): void,
  registerAsChildEntity(entity: DomainObject): void
}

export type StaticEventHandler<E> = (entity: E, evt: ChangeEvent) => void