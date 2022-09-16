import { ExternalEvent } from "./ExternalEvent";

export interface ExternalEventStoreRepository {
  appendEvent(externalEvent: ExternalEvent): Promise<void>

  getByEventId(eventId: string): Promise<ExternalEvent>
}
