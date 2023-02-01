import { SnapshotAggregate } from '../eventSourcing/Aggregate'
import { UUID } from '../util/UUID'

/** Ability to load events from a date for use with snapshots */
export interface WriteModelSnapshotRepository {
  loadSnapshot<T extends SnapshotAggregate>(id: UUID, aggregate: T): Promise<T>

  saveSnapshot<T extends SnapshotAggregate>(aggregate: T): Promise<number>
}
