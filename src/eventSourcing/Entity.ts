import * as Uuid from './UUID'
import { ChangeEvent } from './MessageTypes'
import { Parent } from './Aggregate'

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

export type StaticEventHandler<A> = (entity: A, evt: ChangeEvent) => void
