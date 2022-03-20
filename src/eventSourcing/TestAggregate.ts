import { AggregateContainer } from './AggregateContainer'
import { SnapshotAggregate } from './Aggregate'
import { UUID } from './UUID'
import { TestEntity } from './TestEntity'
import { Uuid } from '..'

export class TestAggregate extends AggregateContainer<TestEntity> implements SnapshotAggregate {
  eventType = 'some-event-type'
  causationId1 = Uuid.createV4()
  correlationId1 = Uuid.createV4()

  constructor() {
    super(() => new TestEntity((e, is) => this.observe(e, is)))
  }

  withRoot(id: UUID): TestAggregate {
    this.rootEntity.applyChangeEvent({
      id: id,
      aggregateRootId: id,
      entityId: id,
      dateTimeOfEvent: new Date().toISOString(),
      eventType: this.eventType,
      causationId: this.causationId1,
      correlationId: this.correlationId1
    })
    return this
  }

  snapshot(): void {
    this.rootEntity.snapshot(new Date().toISOString())
  }

  doSomething() {
    this.rootEntity.applyChangeEvent({
      id: this.id,
      aggregateRootId: this.id,
      entityId: this.id,
      dateTimeOfEvent: new Date().toISOString(),
      eventType: this.eventType,
      causationId: this.causationId1,
      correlationId: this.correlationId1
    })
  }
}
