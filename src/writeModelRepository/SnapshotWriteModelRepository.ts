import { Aggregate, SnapshotAggregate } from '../eventSourcing/Aggregate'
import { UUID } from '../eventSourcing/UUID'

/** Ability to load events from a date for use with snapshots */
export interface SnapshotWriteModelRepository {
  loadFromDate<T extends Aggregate>(id: UUID, aggregate: T, fromDate: string): Promise<T>

  loadSnapshot<T extends Aggregate>(id: UUID, aggregate: T): Promise<T>

  saveSnapshot<T extends SnapshotAggregate>(aggregate: T): Promise<number>
}
