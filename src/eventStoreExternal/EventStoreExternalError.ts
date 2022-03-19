import { ExternalEventStoreProcessingState } from './EventStoreExternal'

export class EventStoreExternalError extends Error {
  constructor(id: string, eventId: string, state: ExternalEventStoreProcessingState) {
    super(`Error in event store external processing id: ${eventId} id: ${eventId} with state: ${state}`)
  }
}
