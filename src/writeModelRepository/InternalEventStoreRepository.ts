import { UUID } from '../eventSourcing/UUID'
import { EntityEvent } from '../eventSourcing/MessageTypes'

export interface InternalEventStoreRepository {
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
   * @argument id The aggregate root id
   * @argument fromDate The date from which dateTimeOfEvent for events should be greater or equal to
   */
  getEventsFromDate(id: UUID, fromDate: string): Promise<EntityEvent[]>
}
