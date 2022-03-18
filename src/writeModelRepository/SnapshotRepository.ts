import {Aggregate} from "../eventSourcing/Aggregate";
import {UUID} from "../eventSourcing/UUID";

/** Ability to load events from a date for use with snapshots */
export interface SnapshotRepository {
    loadFromDate<T extends Aggregate>(id: UUID, aggregate: T, fromDate: string): Promise<T>
}