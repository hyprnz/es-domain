import { Aggregate, SnapShotAggregate } from '../eventSourcing/Aggregate'
import { UUID } from '../eventSourcing/UUID'

/** Ability to load events from a date for use with snapshots */
export interface SnapshotAggregateRepository {
  loadFromDate<T extends Aggregate>(id: UUID, aggregate: T, fromDate: string): Promise<T>

  loadSnapshot<T extends Aggregate>(id: UUID, aggregate: T): Promise<T>

  saveSnapshot<T extends SnapShotAggregate>(id: UUID, aggregate: T, fromDate: string): Promise<number>
}
