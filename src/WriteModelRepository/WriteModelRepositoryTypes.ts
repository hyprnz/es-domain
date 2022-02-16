import { Aggregate, EntityEvent } from "../EventSourcing/EventSourcingTypes";
import { UUID } from "../EventSourcing/UUID";

/** I like to implement a write model useing only 2 keys.
 *  For several reasons: 
 *  - So that it can be implemented by any Key Value store
 *    - e.g. DynamoDb, Table storage both of which use a 2 key system of PartitionKey and Row Key. 
 *  - To prevent other smells like specifying where clauses when fetching evets which should be avoided
 * 
 * Usng these NoSQL KV lookup systems:
 *  - To Identify a single row one must provide Partition and Row key
 *  - A set of rows can also be identified by supplying just a Partition key
 * 
 * Here we would map 
 *  - PartionKey => AggreggateRootId
 *  - Version  => RowKey
 * 
 * Fetching all events for an aggregate root is simply a mater of querying by partition key and is very efficent and inexpensive
 * This also gives us optomistic concurrency detection for free
 */
export interface IWriteModelRepositroy {
  /** Persists an AggregateRoots uncommited events
   * @argument aggregateRoot The aggregateroot to persist
   */
  save<T extends Aggregate>(aggregateRoot: T) : Promise<number>

  /**Loads an aggregate root from persistence
   * @argument id The id of the Aggregate Root to load
   * @argument activator As we do not have reflection in typescript we must provide either an instance or an activation function
   */
  load<T extends Aggregate>(id: UUID, activator: () => T) : Promise<T>

  /** Subscribe to events that are being commited to persistence, this can be used to feed events 
   * to down stream services to create other side effects such as Projections
   * @argument handler A callback function that will receive an array of changes (Unit of work) related to a single aggregate.*/  
  subscribeToChanges(handler: (changes: Array<EntityEvent>) => void ): void
}