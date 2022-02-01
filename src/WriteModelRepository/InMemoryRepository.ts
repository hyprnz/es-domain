import EventEmitter from "events";
import { IAggregateRoot, IEntityEvent } from "../EventSourcing/EventSourcingTypes";
import { UUID } from "../EventSourcing/UUID";
import { WriteModelrRepositoryError as WriteModelRepositoryError } from "./WriteModelRepositoryError";
import { IWriteModelRepositroy } from "./WriteModelRepositoryTypes";



export class WriteModelMemoryRepository implements IWriteModelRepositroy {
  eventEmitter = new EventEmitter();
  store = new Map<UUID, Array<IEntityEvent>>()

  constructor(){}

  save<T extends IAggregateRoot>(aggregateRoot: T): Promise<number> {
    const changes = aggregateRoot.uncommittedChanges()
    if(changes.length === 0) return Promise.resolve(0)

        
    const found = this.store.has(aggregateRoot.id)

    if(found){
      // Optionally do some event vaidation , usefull for test systems
      // [1] Optomistic concurrency
      const commitedEvents = this.store.get(aggregateRoot.id)
      const commitedVersion = commitedEvents[commitedEvents.length-1].version + 1
      const firstUncommitedChangeVersion = changes[0].version

      if(commitedVersion !== firstUncommitedChangeVersion){
        throw new WriteModelRepositoryError(
          typeof aggregateRoot, 
          `Optimistic concurrency error, expected event version:${commitedVersion} but received ${firstUncommitedChangeVersion}, Suggested solution is to retry`
        )
      }
    }


    // Insert vs update
    if(found) this.store.get(aggregateRoot.id).push(...changes)
    else this.store.set(aggregateRoot.id, changes)

    const lastChange = changes[changes.length-1]
    aggregateRoot.markChangesAsCommitted( lastChange.version );
    this.onAfterEventsStored(changes)
    return Promise.resolve(changes.length)
  }

  load<T extends IAggregateRoot>(id: UUID, activator: () => T): T {
    const found = this.store.has(id)
    if(!found) throw new WriteModelRepositoryError(activator.name, `Failed to load aggregate id:${id}: NOT FOUND`)

    const aggregate = activator()
    const events = this.store.get(id)
    aggregate.loadFromHistory(events)
    return aggregate
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

