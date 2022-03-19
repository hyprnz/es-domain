import { UUID } from '../eventSourcing/UUID'
import { EntityEvent } from '../eventSourcing/MessageTypes'
import { WriteModelRepositoryError as WriteModelRepositoryError } from './WriteModelRepositoryError'
import { WriteModelRepository } from './WriteModelRepository'
import { Aggregate, SnapShotAggregate } from '../eventSourcing/Aggregate'
import { InternalEventStoreRepository } from './InternalEventStoreRepository'
import { EventBusInternal } from '../eventSourcing/EventBusInternal'
import { SnapshotAggregateRepository } from './SnapshotAggregateRepository'
import { SnapshotEventStoreRepository } from './SnapshotEventStoreRepository'

export class AggregateRepository implements WriteModelRepository, SnapshotAggregateRepository {
  constructor(
    private readonly eventStore: InternalEventStoreRepository & SnapshotEventStoreRepository,
    private readonly eventBusSync = new EventBusInternal()
  ) {}

  async loadSnapshot<T extends Aggregate>(id: UUID, aggregate: T): Promise<T> {
    const events = await this.eventStore.getSnapshotEvents(id)
    if (events.length === 0) {
      throw new WriteModelRepositoryError('AggregateContainer', `Failed to load aggregate id:${id}: Snapshot not found`)
    }
    aggregate.loadFromHistory(events)
    return Promise.resolve(aggregate)
  }

  async saveSnapshot<T extends SnapShotAggregate>(id: UUID, aggregate: T, fromDate: string): Promise<number> {
    const changes = aggregate.uncommittedChanges()
    if (changes.length === 0) {
      return Promise.resolve(0)
    }
    await this.eventStore.appendSnapshotEvents(aggregate.id, changes)
    aggregate.markSnapshotAsCommitted()
    return changes.length
  }

  async loadFromDate<T extends Aggregate>(id: UUID, aggregate: T, fromDate: string): Promise<T> {
    const events = await this.eventStore.getEventsFromDate(id, fromDate)
    if (events.length === 0) {
      throw new WriteModelRepositoryError('AggregateContainer', `Failed to load aggregate id:${id}: NOT FOUND`)
    }
    aggregate.loadFromHistory(events)
    return Promise.resolve(aggregate)
  }

  async save<T extends Aggregate>(aggregate: T): Promise<number> {
    const changes = aggregate.uncommittedChanges()
    if (changes.length === 0) {
      return Promise.resolve(0)
    }
    await this.eventStore.appendEvents(aggregate.id, changes[0].version, changes)
    aggregate.markChangesAsCommitted(changes[changes.length - 1].version)
    await this.onAfterEventsStored(changes)
    return changes.length
  }

  async load<T extends Aggregate>(id: UUID, aggregate: T): Promise<T> {
    const events = await this.eventStore.getEvents(id)
    if (events.length === 0) {
      throw new WriteModelRepositoryError('AggregateContainer', `Failed to load aggregate id:${id}: NOT FOUND`)
    }
    aggregate.loadFromHistory(events)
    return Promise.resolve(aggregate)
  }

  async loadEvents(id: UUID): Promise<Array<EntityEvent>> {
    return await this.eventStore.getEvents(id)
  }

  subscribeToChangesSynchronously(handler: (changes: Array<EntityEvent>) => Promise<void>) {
    this.eventBusSync.registerHandlerForEvents(handler)
  }

  private async onAfterEventsStored(changes: Array<EntityEvent>): Promise<void> {
    if (changes.length === 0) return
    await this.eventBusSync.callHandlers(changes)
  }
}
