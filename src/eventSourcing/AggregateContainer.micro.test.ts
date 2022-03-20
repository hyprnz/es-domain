import { ChangeEvent } from './MessageTypes'
import { assertThat } from 'mismatched'
import { AggregateContainer } from './AggregateContainer'
import { EntityBase } from './EntityBase'
import { ChangeEventBuilder } from './ChangeEventBuilder'
import { EntityChangedObserver } from './Aggregate'
import { Uuid } from '..'

describe('AggregateContainer', () => {
  class TestEntity extends EntityBase {
    constructor(observer: EntityChangedObserver) {
      super(observer)
    }

    protected makeEventHandler(evt: ChangeEvent): (() => void) | undefined {
      return () => (this.id = evt.aggregateRootId)
    }
  }

  let aggregate: AggregateContainer<TestEntity>

  beforeEach(() => {
    aggregate = new AggregateContainer<TestEntity>()
  })

  describe('loadFromChangeEventsWithVersion', () => {
    const event: ChangeEvent = ChangeEventBuilder.make().to()
    it('multiple events', async () => {
      aggregate.rootEntity = new TestEntity(aggregate.observe)
      aggregate.loadFromChangeEvents([event, event, event], 100)
      assertThat(aggregate.id).is(event.aggregateRootId)
      assertThat(aggregate.changeVersion).is(100)
      assertThat(aggregate.uncommittedChanges()).is([])
      assertThat(aggregate.uncommittedSnapshots()).is([])
      assertThat(aggregate.countOfEvents()).is(0)
    })
  })

  describe('loadFromHistory', () => {
    const event: ChangeEvent = ChangeEventBuilder.make().to()
    it('multiple events', async () => {
      aggregate.rootEntity = new TestEntity(aggregate.observe)
      aggregate.loadFromHistory([
        { version: 0, event },
        { version: 1, event },
        { version: 2, event }
      ])
      assertThat(aggregate.id).is(event.aggregateRootId)
      assertThat(aggregate.changeVersion).is(2)
      assertThat(aggregate.uncommittedChanges()).is([])
      assertThat(aggregate.uncommittedSnapshots()).is([])
      assertThat(aggregate.countOfEvents()).is(3)
    })
  })

  describe('observe', () => {
    const correlationId = Uuid.createV4()
    const causationId = Uuid.createV4()
    const event: ChangeEvent = ChangeEventBuilder.make().withCorrelation(correlationId).withCausation(causationId).to()
    it('change', async () => {
      aggregate.rootEntity = new TestEntity((evt, isSnapshot) => aggregate.observe(evt, isSnapshot))
      aggregate.withCorrelation(correlationId).withCausation(causationId)
      aggregate.loadFromHistory([{ version: 0, event }])
      aggregate.rootEntity.applyChangeEvent(event)
      assertThat(aggregate.id).is(event.aggregateRootId)
      assertThat(aggregate.changeVersion).is(0)
      assertThat(aggregate.uncommittedChanges()).is([{ version: 1, event }])
      assertThat(aggregate.uncommittedSnapshots()).is([])
      assertThat(aggregate.countOfEvents()).is(2)
    })
    it('change which is committed', async () => {
      aggregate.rootEntity = new TestEntity((evt, isSnapshot) => aggregate.observe(evt, isSnapshot))
      aggregate.withCorrelation(correlationId).withCausation(causationId)
      aggregate.loadFromHistory([{ version: 0, event }])
      aggregate.rootEntity.applyChangeEvent(event)
      aggregate.markChangesAsCommitted(100)
      assertThat(aggregate.changeVersion).is(100)
      assertThat(aggregate.uncommittedChanges()).is([])
      assertThat(aggregate.uncommittedSnapshots()).is([])
      assertThat(aggregate.countOfEvents()).is(2)
    })
    it('snapshot', async () => {
      aggregate.rootEntity = new TestEntity((evt, isSnapshot) => aggregate.observe(evt, isSnapshot))
      aggregate.withCorrelation(correlationId).withCausation(causationId)
      aggregate.loadFromHistory([
        { version: 0, event },
        { version: 1, event }
      ])
      aggregate.rootEntity.applySnapshot(event)
      assertThat(aggregate.id).is(event.aggregateRootId)
      assertThat(aggregate.changeVersion).is(1)
      assertThat(aggregate.uncommittedChanges()).is([])
      assertThat(aggregate.uncommittedSnapshots()).is([event])
      assertThat(aggregate.countOfEvents()).is(2)
    })
    it('snapshot which is committed', async () => {
      aggregate.rootEntity = new TestEntity((evt, isSnapshot) => aggregate.observe(evt, isSnapshot))
      aggregate.withCorrelation(correlationId).withCausation(causationId)
      aggregate.loadFromHistory([
        { version: 0, event },
        { version: 1, event }
      ])
      aggregate.rootEntity.applySnapshot(event)
      aggregate.markSnapshotsAsCommitted()
      assertThat(aggregate.changeVersion).is(1)
      assertThat(aggregate.uncommittedChanges()).is([])
      assertThat(aggregate.uncommittedSnapshots()).is([])
      assertThat(aggregate.countOfEvents()).is(2)
    })
  })
})
