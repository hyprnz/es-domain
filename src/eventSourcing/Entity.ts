import * as Uuid from './UUID'
import { ChangeEvent } from './MessageTypes'
import { Parent } from './Aggregate'

export interface Entity<T extends Uuid.UUID = Uuid.UUID> {
  readonly id: T

  handleChangeEvent(event: ChangeEvent): void
}

export interface EventSourcedEntity {
  readonly id: Uuid.UUID
  readonly aggregate: Parent
}

export type StaticEventHandler<E> = (entity: E, evt: ChangeEvent) => void
