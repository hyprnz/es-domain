import * as Uuid from '../eventSourcing/UUID'
import { ExternalEvent } from './ExternalEvent'

export class ExternalEventBuilder {
  private readonly externalEvent: ExternalEvent

  private constructor() {
    this.externalEvent = {
      id: Uuid.createV4(),
      eventId: Uuid.createV4(),
      eventType: 'some-event-type',
      correlationId: Uuid.createV4(),
      causationId: Uuid.createV4()
    }
  }

  to(): ExternalEvent {
    return this.externalEvent
  }

  static make() {
    return new ExternalEventBuilder()
  }
}
