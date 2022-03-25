import { EntityBase } from './EntityBase'
import { EntityChangedObserver } from './Aggregate'
import { ChangeEvent } from './MessageTypes'
import { EntityContructorPayload, SnapshotEntity } from './Entity'
import { Uuid } from '..'

export class TestEntity extends EntityBase implements SnapshotEntity {
  eventType = 'some-event-type'
  causationId1 = Uuid.createV4()
  correlationId1 = Uuid.createV4()

  constructor(observer: EntityChangedObserver, payload: EntityContructorPayload, isLoading: boolean = false) {
    super(observer)

    if (!isLoading) {
      this.applyChangeEvent({
        id: payload.id,
        aggregateRootId: payload.id,
        entityId: payload.id,
        dateTimeOfEvent: new Date().toISOString(),
        eventType: this.eventType,
        causationId: this.causationId1,
        correlationId: this.correlationId1
      })
    }
  }

  static toCreationParameters(event: any): EntityContructorPayload {
    return { id: event.id }
  }

  protected makeEventHandler(evt: ChangeEvent): (() => void) | undefined {
    return () => (this.id = evt.aggregateRootId)
  }

  snapshot(dateTimeOfEvent: string): ChangeEvent[] {
    return [{
      id: this.id,
      aggregateRootId: this.id,
      entityId: this.id,
      dateTimeOfEvent,
      eventType: this.eventType,
      causationId: this.causationId1,
      correlationId: this.correlationId1
    }]
  }
}
