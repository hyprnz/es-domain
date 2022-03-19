import { ExternalEvent } from '../eventSourcing/MessageTypes'
import { ExternalEventStoreRepository } from './ExternalEventStoreRepository'
import { IdempotencyError } from './IdempotencyError'

export class ExternalEventStoreInMemoryRepository implements ExternalEventStoreRepository {
  private readonly store = new Map<string, ExternalEvent>()

  async appendEvent(externalEvent: ExternalEvent): Promise<void> {
    if (await this.exists(externalEvent.eventId)) {
      throw new IdempotencyError(externalEvent.id, externalEvent.eventId)
    }
    this.store.set(externalEvent.eventId, externalEvent)
  }

  async getByEventId(eventId: string): Promise<ExternalEvent> {
    const event = this.store.get(eventId)
    if (!event) {
      throw new Error(`Unable to find event with eventId: ${eventId}`)
    }
    return event
  }

  private async exists(eventId: string): Promise<boolean> {
    return this.store.has(eventId)
  }
}
