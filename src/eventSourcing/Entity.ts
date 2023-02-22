import * as Uuid from '../util/UUID'
import { EntityChangedObserver } from './Aggregate'
import { ChangeEvent } from './contracts/MessageTypes'

export interface Entity {
  readonly id: Uuid.UUID

  handleChangeEvent(event: ChangeEvent): void
}

export interface SnapshotEntity {
  snapshot(dateTimeOfEvent: string): ChangeEvent[]
}

export interface EntityConstructorPayload {
  id: Uuid.UUID
}

export interface EntityConstructor<T extends Entity, U extends EntityConstructorPayload> {
  new (observer: EntityChangedObserver, payload: U, isLoading?: boolean): T

  /** Converts from Creation event to constructor parameters, this is required as javascript does not support
   * constructor overloads
   * @param event Creation event
   * @returns Constructor parameters
   */
  toCreationParameters(event: EntityConstructorPayload): U
}

export type StaticEventHandler<E> = (entity: E, evt: ChangeEvent) => void

export function isSnapshotableEntity(entity: unknown): entity is SnapshotEntity {
  const maybeSnapshotable = entity as Partial<SnapshotEntity>
  return !!maybeSnapshotable.snapshot
}

export function isEntityConstructor<T extends Entity, U extends EntityConstructorPayload>(
  entityType: unknown
): entityType is EntityConstructor<T, U> {
  if (!entityType) return false
  const maybeEntityconstructor = entityType as Partial<EntityConstructor<T, U>>
  if (typeof maybeEntityconstructor.toCreationParameters !== 'function') return false
  if (typeof maybeEntityconstructor !== 'function') return false

  return true
}

export function assertIsEntityConstructor<T extends Entity, U extends EntityConstructorPayload>(
  entityType: unknown
): asserts entityType is EntityConstructor<T, U> {
  if (!isEntityConstructor(entityType)) throw new Error('Value is not a EntityConstructor')
}
