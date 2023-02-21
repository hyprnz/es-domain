import { Aggregate, ChangeEvent, EntityEvent, EventStoreRepository } from '.'
import { EventBusProducer } from '../eventBus'
import { EventBus } from './contracts/EventBus'

export type EventMiddleware = (evt: ChangeEvent) => Promise<ChangeEvent>
type EventDeserializer = Record<string, EventMiddleware | undefined>

export class EventStore {
  private eventMiddleware: EventDeserializer = {}

  constructor(private readonly eventStoreRepo: EventStoreRepository, private readonly bus: EventBus<EntityEvent>) {}

  /**
   * Added as a convenience method to easily save events
   * @param eventStore EventStore used for appending events
   * @param aggregate The aggregate to save
   * @returns The number of events appended to the event store
   */
  static async save(eventStore: EventStore, aggregate: Aggregate): Promise<number> {
    const changes = aggregate.uncommittedChanges()
    if (changes.length === 0) {
      return Promise.resolve(0)
    }
    const initialVersion = changes[0].version
    await eventStore.appendEvents(aggregate.id, initialVersion, changes)
    aggregate.markChangesAsCommitted()
    return changes.length
  }

  async appendEvents(aggregateRootId: string, changeVersion: number, events: EntityEvent[]): Promise<void> {
    let expectedVersion = changeVersion
    events.forEach(x => {
      if (x.event.aggregateRootId !== aggregateRootId)
        throw new EventStoreError(aggregateRootId, 'Cannot store events for multiple aggregate roots in one transaction')
      if (x.version !== expectedVersion) throw new EventStoreError(aggregateRootId, 'Inconsistant Event versions')
      expectedVersion++
    })
    await this.eventStoreRepo.appendEvents(aggregateRootId, changeVersion, events)
    await this.onAfterEventsStored(events)
  }

  getEvents(id: string): Promise<EntityEvent[]> {
    return this.eventStoreRepo
      .getEvents(id)
      .then(rawEvents => rawEvents.map(x => this.deserialize(x)))
      .then(x => Promise.all(x))
  }
  getEventsAfterVersion(id: string, version: number): Promise<EntityEvent[]> {
    return this.eventStoreRepo
      .getEventsAfterVersion(id, version)
      .then(rawEvents => rawEvents.map(x => this.deserialize(x)))
      .then(x => Promise.all(x))
  }

  registerCallback(handler: (changes: Array<EntityEvent>) => Promise<void>): this {
    this.bus.registerHandlerForEvents(handler)
    return this
  }

  registerEventDeserializer(eventType: string, handler: EventMiddleware, appendIfExists = false): void {
    const existingHandler = this.eventMiddleware[eventType]

    if (existingHandler) {
      if (appendIfExists) {
        this.eventMiddleware[eventType] = e => existingHandler(e).then(handler)
        return
      }
      throw new Error(`Handler for eventType:${eventType} already registered`)
    }

    this.eventMiddleware[eventType] = handler
  }

  private async deserialize(event: EntityEvent): Promise<EntityEvent> {
    const { eventType } = event.event
    const middleware = this.eventMiddleware[eventType]

    return {
      version: event.version,
      event: middleware ? await middleware(event.event) : event.event
    }
  }

  private async onAfterEventsStored(changes: Array<EntityEvent>): Promise<void> {
    if (changes.length === 0) return
    await this.bus.callHandlers(changes)
  }
}

export class EventStoreError extends Error {
  constructor(aggregateRootId: string, description: string) {
    super(`Error: ${aggregateRootId}, ${description}`)
  }
}

export class EventStoreBuilder {
  eventBus: EventBus<EntityEvent>
  eventStoreRepo: EventStoreRepository | undefined = undefined

  private constructor() {
    this.eventBus = new EventBusProducer()
  }

  static withRepository(eventStoreRepo: EventStoreRepository): EventStoreBuilder {
    const builder = new EventStoreBuilder()
    builder.eventStoreRepo = eventStoreRepo
    return builder
  }

  withEventBus(eventBus: EventBus<EntityEvent>): this {
    this.eventBus = eventBus
    return this
  }

  make(): EventStore {
    if (!this.eventStoreRepo) throw new Error('Missing event repositrory')

    return new EventStore(this.eventStoreRepo, this.eventBus)
  }
}
