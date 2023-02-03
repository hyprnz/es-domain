import { UUID } from '../../util/UUID'
import { EntityEvent } from './MessageTypes'

/**
 * Represents the low level get and append operations against the event persistance
 * This interface is implemented in other libraries to support various persistence mechansums like
 * For Example: DynamoDb, TableStorage
 */
export interface EventStoreRepository {
  /** Appends events to event store. This should be an attomic operation which throws an `OptimisticConcurrencyError`
   * if an event with the same version already exists for this aggregate root.
   * @argument id The aggregate root id
   * @argument events - the events to append.
   * @throws OptimisticConcurrencyError
   */
  appendEvents(id: UUID, changeVersion: number, events: EntityEvent[]): Promise<void>

  /** Gets all events for an aggregate
   * @argument id The aggregate root id
   */
  getEvents(id: UUID): Promise<EntityEvent[]>

  /** Gets events greater than or equal to the specified date
   * @argument id - The aggregate root id
   * @argument version - The starting event version number events must be greater than
   */
  getEventsAfterVersion(id: UUID, version: number): Promise<EntityEvent[]>
}
