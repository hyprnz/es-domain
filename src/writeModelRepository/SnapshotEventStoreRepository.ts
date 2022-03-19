import { UUID } from '../eventSourcing/UUID'
import { EntityEvent } from '../eventSourcing/MessageTypes'

export interface SnapshotEventStoreRepository {
  /** Gets events greater than or equal to the specified date
   * @argument id The aggregate root id
   * @argument fromDate The date from which dateTimeOfEvent for events should be greater or equal to
   */
  getEventsFromDate(id: UUID, fromDate: string): Promise<EntityEvent[]>

  /** Load snapshot events for aggregate
   * @argument id The aggregate root id
   */
  getSnapshotEvents(id: UUID): Promise<EntityEvent[]>

  /** Persists an aggregate as a snapshot
   * @argument aggregateRoot The aggregate root to persist
   */
  appendSnapshotEvents(id: UUID, snapshots: EntityEvent[]): Promise<void>
}
