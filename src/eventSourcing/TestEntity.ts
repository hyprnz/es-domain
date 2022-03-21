import { EntityBase } from './EntityBase'
import { EntityChangedObserver } from './Aggregate'
import { ChangeEvent } from './MessageTypes'
import { SnapshotEntity } from './Entity'
import { Uuid } from '..'

export class TestEntity extends EntityBase implements SnapshotEntity {
  eventType = 'some-event-type'
  causationId = Uuid.createV4()
  correlationId = Uuid.createV4()

  constructor(observer: EntityChangedObserver) {
    super(observer)
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
      causationId: this.causationId,
      correlationId: this.correlationId
    }]
    // this.applySnapshot({
    //   id: this.id,
    //   aggregateRootId: this.id,
    //   entityId: this.id,
    //   dateTimeOfEvent,
    //   eventType: this.eventType,
    //   causationId: this.causationId,
    //   correlationId: this.correlationId
    // })
  }
}
