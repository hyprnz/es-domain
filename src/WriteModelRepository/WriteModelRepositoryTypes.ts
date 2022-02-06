import { IAggregateRoot, IEntityEvent } from "../EventSourcing/EventSourcingTypes";
import { UUID } from "../EventSourcing/UUID";

export interface IWriteModelRepositroy {
  /** Persists an AggregateRoots uncommited events
   * @argument aggregateRoot The aggregateroot to persist
   */
  save<T extends IAggregateRoot>(aggregateRoot: T) : Promise<number>

  /**Loads an aggregate root from persistence
   * @argument id The id of the Aggregate Root to load
   * @argument activator As we do not have reflection in typescript we must provide either an instance or an activation function
   */
  load<T extends IAggregateRoot>(id: UUID, activator: () => T) : Promise<T>

  /** Subscribe to events that are being commited to persistence, this can be used to feed events 
   * to down stream services to create other side effects such as Projections
   * @argument handler A callback function that will receive an array of changes (Unit of work) related to a single aggregate.*/  
  subscribeToChanges(handler: (changes: Array<IEntityEvent>) => void )
}