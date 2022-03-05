import * as Uuid from '../EventSourcing/UUID'
import EventEmitter from "events";
import { Aggregate, EntityEvent } from "../EventSourcing/EventSourcingTypes";
import { UUID } from "../EventSourcing/UUID";
import { WriteModelrRepositoryError as WriteModelRepositoryError } from "./WriteModelRepositoryError";
import { WriteModelRepository } from '../EventSourcing/WriteModelTypes';

export class WriteModelMemoryRepository implements WriteModelRepository {
  private readonly eventEmitter = new EventEmitter();
  private readonly store = new Map<UUID, Array<EntityEvent>>()

  constructor(){}

  save<T extends Aggregate>(aggregateRoot: T): Promise<number> {
    const changes = aggregateRoot.uncommittedChanges()
    if(changes.length === 0) return Promise.resolve(0)

    const committedEvents = this.store.get(aggregateRoot.id)
    const found = !!committedEvents
    if(found){
      // Optionally do some event validation , useful for test systems
      // [1] Optimistic concurrency
      
      const committedVersion = committedEvents[committedEvents.length-1].version + 1
      const firstUncommittedChangeVersion = changes[0].version

      if(committedVersion !== firstUncommittedChangeVersion){
        const error =  new WriteModelRepositoryError(
          "AggregateRoot", 
          `Optimistic concurrency error, expected event version:${committedVersion} but received ${firstUncommittedChangeVersion}, Suggested solution is to retry`
        )
        return Promise.reject(error)
      }
    }

    // Insert vs update
    if(found) committedEvents.push(...changes)
    else this.store.set(aggregateRoot.id, changes)

    const lastChange = changes[changes.length-1]
    aggregateRoot.markChangesAsCommitted( lastChange.version );
    this.onAfterEventsStored(changes)
    return Promise.resolve(changes.length)
  }

  load<T extends Aggregate>(id: UUID, activator: (id:Uuid.UUID) => T): Promise<T> {
    const events = this.store.get(id)
    const found = !!events
    if(!found) throw new WriteModelRepositoryError(activator.name, `Failed to load aggregate id:${id}: NOT FOUND`)

    const aggregate = activator(id)
    aggregate.loadFromHistory(events)
    return Promise.resolve(aggregate)
  }

  loadEvents(id: UUID): Promise<Array<EntityEvent>> {
    const events = this.store.get(id) || []
    return Promise.resolve(events)
  }

  subscribeToChanges(handler: (changes: Array<EntityEvent>) => void ){
    this.eventEmitter.addListener('events', handler)
  }

  private onAfterEventsStored(changes: Array<EntityEvent>)
  {      
      if(changes.length){        
        this.eventEmitter.emit('events', changes)
      }      
  }
}

