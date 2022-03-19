import { UUID } from '../eventSourcing/UUID'
import {ChangeEvent, EntityEvent} from '../eventSourcing/MessageTypes'

export interface SnapshotEventStoreRepository {
  /** Load snapshot events for aggregate
   * @argument id The aggregate root id
   */
  getSnapshotEvents(id: UUID): Promise<EntityEvent[]>

  /** Persists an aggregate as a set of snapshot events
   * @argument id - aggregate root id
   * @argument snapshots - the events that represent the current state of the entity. These are
   * change events as version numbers are managed internally
   */
  appendSnapshotEvents(id: UUID, snapshots: ChangeEvent[]): Promise<void>
}
