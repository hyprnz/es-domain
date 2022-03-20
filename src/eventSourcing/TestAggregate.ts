import { AggregateContainer } from './AggregateContainer'
import { SnapshotAggregate } from './Aggregate'
import { UUID } from './UUID'
import { TestEntity } from './TestEntity'
import { Uuid } from '..'

export class TestAggregate extends AggregateContainer<TestEntity> implements SnapshotAggregate {
  eventType = 'some-event-type'
  causationId1 = Uuid.createV4()
  correlationId1 = Uuid.createV4()

  withRoot(id: UUID): TestAggregate {
    this.rootEntity = new TestEntity((e, is) => this.observe(e, is))
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
}
