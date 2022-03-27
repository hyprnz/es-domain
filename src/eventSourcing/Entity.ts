import * as Uuid from './UUID'
import { ChangeEvent } from './MessageTypes'
import { EntityChangedObserver, Parent } from './Aggregate'

export interface Entity {
  readonly id: Uuid.UUID

  handleChangeEvent(event: ChangeEvent): void
}

export interface SnapshotEntity {
  snapshot(dateTimeOfEvent: string): void
}

export interface EventSourcedEntity {
  readonly id: Uuid.UUID
  readonly aggregate: Parent
}

export interface EntityConstructorPayload {
  id: Uuid.UUID  
}

export interface EntityConstructor<T extends Entity, U extends EntityConstructorPayload>{
  new (observer: EntityChangedObserver, payload: U, isLoading?: boolean): T
  toCreationParameters(event: EntityConstructorPayload) : U
}

export type StaticEventHandler<A> = (entity: A, evt: ChangeEvent) => void
