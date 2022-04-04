import { UUID } from '../eventSourcing/UUID'
import { EntityEvent } from '../eventSourcing/MessageTypes'
import { WriteModelRepositoryError as WriteModelRepositoryError } from './WriteModelRepositoryError'
import { WriteModelRepository } from './WriteModelRepository'
import { Aggregate } from '../eventSourcing/Aggregate'
import { InternalEventStore } from './InternalEventStore'
import { EventBusInternal } from '../eventSourcing/EventBusInternal'

export class AggregateRepository implements WriteModelRepository {
  constructor(private readonly eventRepository: InternalEventStore, private readonly bus = new EventBusInternal()) {}

  async save<T extends Aggregate>(aggregate: T): Promise<number> {
    const changes = aggregate.uncommittedChanges()
    if (changes.length === 0) {
      return Promise.resolve(0)
    }
    await this.eventRepository.appendEvents(aggregate.id, changes[0].version, changes)
    aggregate.markChangesAsCommitted(changes[changes.length - 1].version)
    await this.onAfterEventsStored(changes)
    return changes.length
  }

  async load<T extends Aggregate>(id: UUID, aggregate: T): Promise<T> {
    const events = await this.eventRepository.getEvents(id)
    aggregate.loadFromHistory(events)
    return aggregate
  }

  /** This method is mainly provider for test purposes, so that we can inspect persisted events */
  async loadEvents(id: UUID): Promise<Array<EntityEvent>> {
    return await this.eventRepository.getEvents(id)
  }

  async loadAfterVersion<T extends Aggregate>(id: UUID, aggregate: T, version: number): Promise<T> {
    const events = await this.eventRepository.getEventsAfterVersion(id, version)
    
    //BLAIR : Why would be ever need to do this ? If it is related to snapshots the snapshot should set the version and then we load
    // aggregate.changeVersion = version  
    aggregate.loadFromHistory(events)
    return aggregate
  }

  subscribeToChangesSynchronously(handler: (changes: Array<EntityEvent>) => Promise<void>) {
    this.bus.registerHandlerForEvents(handler)
  }

  private async onAfterEventsStored(changes: Array<EntityEvent>): Promise<void> {
    if (changes.length === 0) return
    await this.bus.callHandlers(changes)
  }
}
