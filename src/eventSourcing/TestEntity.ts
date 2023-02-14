import { Uuid } from '..'
import { EntityChangedObserver } from './Aggregate'
import { ChangeEvent } from './contracts/MessageTypes'
import { EntityConstructorPayload, SnapshotEntity } from './Entity'
import { EntityBase } from './EntityBase'

export class TestEntity extends EntityBase implements SnapshotEntity {
  eventType = 'some-event-type'
  causationId1 = Uuid.createV4()
  correlationId1 = Uuid.createV4()

  constructor(observer: EntityChangedObserver, payload: EntityConstructorPayload, isLoading = false) {
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

  doSomething() {
    this.applyChangeEvent({
      id: this.id,
      aggregateRootId: this.id,
      entityId: this.id,
      dateTimeOfEvent: new Date().toISOString(),
      eventType: this.eventType,
      causationId: this.causationId1,
      correlationId: this.correlationId1
    })
  }

  static toCreationParameters(event: any): EntityConstructorPayload {
    return { id: event.id }
  }

  protected makeEventHandler(evt: ChangeEvent): (() => void) | undefined {
    return () => (this.id = evt.aggregateRootId)
  }

  snapshot(dateTimeOfEvent: string): ChangeEvent[] {
    return [
      {
        id: this.id,
        aggregateRootId: this.id,
        entityId: this.id,
        dateTimeOfEvent,
        eventType: this.eventType,
        causationId: this.causationId1,
        correlationId: this.correlationId1
      }
    ]
  }
}
