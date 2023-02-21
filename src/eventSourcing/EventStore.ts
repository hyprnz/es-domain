import { ChangeEvent, EntityEvent, EventStoreRepository } from '.'
import { EventBus } from './contracts/EventBus'

export type EventMiddleware = (evt: ChangeEvent) => Promise<ChangeEvent>
type EventDeserializer = Record<string, EventMiddleware | undefined>

export class EventStore {
  private eventMiddleware: EventDeserializer = {}

  constructor(private readonly eventStoreRepo: EventStoreRepository, private readonly bus: EventBus<EntityEvent>) {}
  async appendEvents(id: string, changeVersion: number, events: EntityEvent[]): Promise<void> {
    await this.eventStoreRepo.appendEvents(id, changeVersion, events)
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
