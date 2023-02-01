import { ChangeEvent } from './MessageTypes'
import * as Uuid from '../util/UUID'

export class ChangeEventBuilder {
  private constructor(private event: ChangeEvent) {}

  static make() {
    return new ChangeEventBuilder({
      id: Uuid.createV4(),
      correlationId: Uuid.createV4(),
      causationId: Uuid.createV4(),
      eventType: 'test-event-type',
      entityId: Uuid.createV4(),
      aggregateRootId: Uuid.createV4(),
      dateTimeOfEvent: new Date().toISOString()
    })
  }

  withAggregateRootId(aggregateRootId: Uuid.UUID): this {
    this.event = { ...this.event, aggregateRootId }
    return this
  }

  withCausation(causationId: Uuid.UUID): this {
    this.event = { ...this.event, causationId }
    return this
  }

  withCorrelation(correlationId: Uuid.UUID): this {
    this.event = { ...this.event, correlationId }
    return this
  }

  to(): ChangeEvent {
    return this.event
  }
}
