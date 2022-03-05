import { UUID } from "../eventSourcing/UUID";
import {AggregateEntity} from "../eventSourcing/AggregateEntity";
import {EntityEvent} from "../eventSourcing/MessageTypes";

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
  save<T extends AggregateEntity>(aggregateRoot: T) : Promise<number>

  /**Loads an aggregate root from persistence
   * @argument id The id of the Aggregate Root to load
   * @argument activator As we do not have reflection in typescript we must provide either an instance or an activation function
   */
  load<T extends AggregateEntity>(id: UUID, activator: (id:UUID) => T) : Promise<T>

  /** Subscribe to events that are being commited to persistence, this can be used to feed events 
   * to down stream services to create other side effects such as Projections
   * @argument handler A callback function that will receive an array of changes (Unit of work) related to a single aggregate.*/  
  subscribeToChangesAsynchronously(handler: (changes: Array<EntityEvent>) => void ): void

  /** Utility function, not sure if its going to be needed or not but is useful */
  loadEvents(id: UUID): Promise<Array<EntityEvent>> 
}