import EventEmitter from "events";
import { IAggregateRoot, IEntityEvent } from "../EventSourcing/EventSourcingTypes";
import { UUID } from "../EventSourcing/UUID";
import { WriteModelrRepositoryError as WriteModelRepositoryError } from "./WriteModelRepositoryError";
import { IWriteModelRepositroy } from "./WriteModelRepositoryTypes";



export class WriteModelMemoryRepository implements IWriteModelRepositroy {
  private readonly eventEmitter = new EventEmitter();
  private readonly store = new Map<UUID, Array<IEntityEvent>>()

  constructor(){}

  save<T extends IAggregateRoot>(aggregateRoot: T): Promise<number> {
    const changes = aggregateRoot.uncommittedChanges()
    if(changes.length === 0) return Promise.resolve(0)

        
    const commitedEvents = this.store.get(aggregateRoot.id)
    const found = !!commitedEvents
    if(found){
      // Optionally do some event vaidation , usefull for test systems
      // [1] Optomistic concurrency
      
      const commitedVersion = commitedEvents[commitedEvents.length-1].version + 1
      const firstUncommitedChangeVersion = changes[0].version

      if(commitedVersion !== firstUncommitedChangeVersion){
        const error =  new WriteModelRepositoryError(
          "AggregateRoot", 
          `Optimistic concurrency error, expected event version:${commitedVersion} but received ${firstUncommitedChangeVersion}, Suggested solution is to retry`
        )
        return Promise.reject(error)
      }
    }


    // Insert vs update
    if(found) commitedEvents.push(...changes)
    else this.store.set(aggregateRoot.id, changes)

    const lastChange = changes[changes.length-1]
    aggregateRoot.markChangesAsCommitted( lastChange.version );
    this.onAfterEventsStored(changes)
    return Promise.resolve(changes.length)
  }

  load<T extends IAggregateRoot>(id: UUID, activator: () => T): Promise<T> {
    const events = this.store.get(id)
    const found = !!events
    if(!found) throw new WriteModelRepositoryError(activator.name, `Failed to load aggregate id:${id}: NOT FOUND`)

    const aggregate = activator()
    aggregate.loadFromHistory(events)
    return Promise.resolve(aggregate)
  }

  subscribeToChanges(handler: (changes: Array<IEntityEvent>) => void ){
    this.eventEmitter.addListener('events', handler)
  }

  private onAfterEventsStored(changes: Array<IEntityEvent>)
  {      
      if(changes.length){        
        this.eventEmitter.emit('events', changes)
      }      
  }
}

