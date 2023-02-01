import * as Uuid from '../util/UUID'
import { ChangeEvent } from './MessageTypes'
import { EntityChangedObserver } from './Aggregate'

export interface Entity {
  readonly id: Uuid.UUID

  handleChangeEvent(event: ChangeEvent): void
}

export interface SnapshotEntity {
  snapshot(dateTimeOfEvent: string): void
}

export interface EntityConstructorPayload {
  id: Uuid.UUID
}

export interface EntityConstructor<T extends Entity, U extends EntityConstructorPayload>{
  new (observer: EntityChangedObserver, payload: U, isLoading?: boolean): T
  toCreationParameters(event: EntityConstructorPayload) : U
}

export type StaticEventHandler<E> = (entity: E, evt: ChangeEvent) => void


export function isSnapshotableEntity(entity: unknown) : entity is SnapshotEntity {
  const maybeSnapshotable = entity as Partial<SnapshotEntity>
  return !!maybeSnapshotable.snapshot
}
