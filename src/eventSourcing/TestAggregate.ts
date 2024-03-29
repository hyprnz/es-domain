import { AggregateContainer } from './AggregateContainer'
import { SnapshotAggregate } from './Aggregate'
import { UUID } from '../util/UUID'
import { TestEntity } from './TestEntity'
import { ChangeEvent, Uuid } from '..'

export class TestSnapshotableAggregate extends AggregateContainer<TestEntity> implements SnapshotAggregate {
  eventType = 'some-event-type'
  causationId1 = Uuid.createV4()
  correlationId1 = Uuid.createV4()

  constructor() {
    super(TestEntity)
  }

  withRoot(id: UUID): TestSnapshotableAggregate {
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

  snapshot(): ChangeEvent[] {
    return this.rootEntity.snapshot(new Date().toISOString())
  }
}
