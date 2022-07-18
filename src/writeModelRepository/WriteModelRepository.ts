import { UUID } from '../eventSourcing/UUID'
import { Aggregate, SnapshotAggregate } from '../eventSourcing/Aggregate'
import { ChangeEvent, EntityEvent } from '../eventSourcing/MessageTypes'


export type EventMiddleware = (evt: ChangeEvent) => Promise<ChangeEvent>

/** Write model uses only 2 keys.
 *  For several reasons:
 *  - So that it can be implemented by any Key Value store
 *    - e.g. DynamoDb, Table storage both of which use a 2 key system of PartitionKey and Row Key.
 *  - To prevent other smells like specifying where clauses when fetching events which should be avoided
 *
 * Using these NoSQL KV lookup systems:
 *  - To Identify a single row one must provide Partition and Row key
 *  - A set of rows can also be identified by supplying just a Partition key
 *
 * Here we would map
 *  - PartitionKey => AggregateRootId
 *  - Version  => RowKey
 *
 * Fetching all events for an aggregate root is simply a matter of querying by partition key which is efficient and inexpensive
 * This also gives us optimistic concurrency detection for free
 */
export interface WriteModelRepository {
  /** Persists an AggregateRoots uncommited events
   * @argument aggregateRoot The aggregateroot to persist
   */
  save<T extends Aggregate>(aggregate: T): Promise<number>

  /**Loads an aggregate root from persistence
   * @argument id The id of the Aggregate Root to load
   * @argument aggregate instance to load events into
   */
  load<T extends Aggregate>(id: UUID, aggregate: T): Promise<T>

  /** Loads an aggregate root from a version
   * @argument id - of the Aggregate Root to load
   * @argument aggregate - instance to load events into
   * @argument version - only events with version greater than this will be loaded
   * */
  loadAfterVersion<T extends SnapshotAggregate>(id: UUID, aggregate: T, version: number): Promise<T>

  /** Synchronously subscribe to events that have been committed to persistence, this can be used to feed events
   * to down stream services to create Projections
   * @argument handler A callback function that will receive an array of changes (Unit of work) related to a single aggregate.*/
  subscribeToChangesSynchronously(handler: (changes: Array<EntityEvent>) => Promise<void>): void

  /** Utility function, not sure if its going to be needed or not but is useful */
  loadEvents(id: UUID): Promise<Array<EntityEvent>>

  /**
   * Register a handler that is invoked after the event is loded from persistence.
   * This is a general purpose handler, that was initially designed as a centralaised deserilzation mechanisum
   * @param eventType The event type that will trigger this handler
   * @param handler The handler function to be triggered after an event of this type is loaded from persistence
   */
  addEventPostProcessor(eventType: string, handler: EventMiddleware) : void

  /**
   * Register a handler that is invoked after the event is loded from persistence.
   * This is a general purpose handler, that was initially designed as a centralaised deserilzation mechanisum
   * @param eventType The event type that will trigger this handler
   * @param handler The handler function to be triggered after an event of this type is loaded from persistence
   * @param appendIfExists If true new handlers are chained after existing, if false attempting to re-add throws an error, (default false)
   */
  addEventPostProcessor(eventType: string, handler: EventMiddleware, appendIfExists: boolean) : void
}
