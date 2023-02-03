import { UUID } from '../util/UUID'
import { EntityEvent } from '../eventSourcing/MessageTypes'

export interface EventStoreRepository {
  /** Gets events greater than or equal to the specified date. Should throw optimistic concurrency error
   * if versions are incorrect.
   * @argument id The aggregate root id
   * @argument events - the events to append.
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