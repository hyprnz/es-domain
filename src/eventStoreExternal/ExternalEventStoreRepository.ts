import { ExternalEvent } from '../eventSourcing/MessageTypes'

export interface ExternalEventStoreRepository {
  appendEvent(externalEvent: ExternalEvent): Promise<void>

  getByEventId(eventId: string): Promise<ExternalEvent>
}
