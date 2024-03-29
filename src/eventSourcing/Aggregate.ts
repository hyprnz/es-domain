import * as Uuid from '../util/UUID'
import { ChangeEvent, EntityEvent } from './contracts/MessageTypes'

export interface Aggregate {
  readonly id: Uuid.UUID
  readonly changeVersion: number

  loadFromHistory(events: Array<EntityEvent>): void
  uncommittedChanges(): Array<EntityEvent>
  markChangesAsCommitted(version?: number): void
}

export interface SnapshotAggregate extends Aggregate {
  countOfEvents(): number
  loadFromVersion(events: Array<ChangeEvent>, version: number): void
  snapshot(): ChangeEvent[]
}

export type EntityChangedObserver = (event: ChangeEvent) => void

export function isSnapshotableAggregate(aggregate: Aggregate) : aggregate is SnapshotAggregate {
  const maybeSnapshotable = aggregate as Partial<SnapshotAggregate>
  return !!maybeSnapshotable.snapshot
}
