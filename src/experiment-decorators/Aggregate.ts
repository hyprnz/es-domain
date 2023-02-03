import { ChangeEvent, EntityEvent } from './MessageTypes'
import { EventSourcedEntity } from './Entity'
import { Uuid } from '..'

export interface Aggregate {
  readonly id: Uuid.UUID
  changeVersion: number

  loadFromHistory(events: Array<EntityEvent>): void

  uncommittedChanges(): Array<EntityEvent>

  markChangesAsCommitted(version: number): void
}

export interface Parent {
  id(): Uuid.UUID
  correlationId(): Uuid.UUID | undefined
  causationId(): Uuid.UUID | undefined

  addChangeEvent(event: ChangeEvent): void
  registerEntity(entity: EventSourcedEntity): void
}
