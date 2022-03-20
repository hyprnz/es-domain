import { UUID } from '../eventSourcing/UUID'
import { ChangeEvent } from '../eventSourcing/MessageTypes'
import { AggregateSnapshot } from './InMemorySnapshotEventStoreRepository'

export interface SnapshotEventStoreRepository {
  /** Load snapshot events for aggregate
   * @argument id The aggregate root id
   */
  getAggregateSnapshot(id: UUID): Promise<AggregateSnapshot>

  /** Persists an aggregate as a set of snapshot events
   * @argument id - aggregate root id
   * @argument snapshots - the events that represent the current state of the entity. These are
   * change events as version numbers are managed internally
   */
  appendSnapshotEvents(id: UUID, version: number, snapshots: ChangeEvent[]): Promise<void>
}
