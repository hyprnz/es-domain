import { createV4, UUID } from './UUID'

export const UNINITIALISED_AGGREGATE_VERSION = -1

export interface Delta {
  [key: string]: any
}

export interface Entity {
  id: UUID,
  aggregate: ParentAggregate
}

export interface ParentAggregate {
  id() : UUID,
  addChangeEvent(event: ChangeEvent): void,
  registerChildEntity(entity: Entity): void
}

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

  loadFromHistory(events: Array<EntityEvent>): void
  uncommittedChanges(): Array<EntityEvent>
  markChangesAsCommitted(): void
}

export interface OldEntity {
  readonly id: UUID
  applyChangeEvent(event: ChangeEvent): void
}

export type StaticEventHandler<E> = (entity: E, evt: ChangeEvent) => void

export type EventConstructor<E extends AbstractChangeEvent> = {
    new (
        aggregateRootId: UUID,
        entityId: UUID,
        delta: E["delta"]
    ): E
    eventType: string
}

export abstract class AbstractChangeEvent implements ChangeEvent {
  readonly id: UUID;
  abstract readonly eventType: string
  constructor(
    public readonly aggregateRootId: UUID,
    readonly entityId: UUID,
    readonly delta: {[key:string]: any} = {},
    ) {
    this.id = createV4()
  }
}