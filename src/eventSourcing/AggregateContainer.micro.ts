import { ChangeEvent } from './MessageTypes'
import { assertThat, match } from 'mismatched'
import { EntityBase } from './EntityBase'
import { ChangeEventBuilder } from './ChangeEventBuilder'
import { EntityChangedObserver } from './Aggregate'
import { Uuid } from '..'
import { TestSnapshotableAggregate } from './TestAggregate'

describe('AggregateContainer', () => {
  class TestEntity extends EntityBase {
    constructor(observer: EntityChangedObserver) {
      super(observer)
    }

    protected makeEventHandler(evt: ChangeEvent): (() => void) | undefined {
      return () => (this.id = evt.aggregateRootId)
    }
  }

  let aggregate: TestSnapshotableAggregate

  beforeEach(() => {
    aggregate = new TestSnapshotableAggregate()
  })

  describe('loadFromVersion', () => {

    it('multiple events', async () => {
      const id = Uuid.createV4()
      const event: ChangeEvent = ChangeEventBuilder.make()
        .withAggregateRootId(id)
        .to()

      aggregate.loadFromVersion([event, event, event], 100)
      assertThat(aggregate.id).is(event.aggregateRootId)
      assertThat(aggregate.changeVersion).is(100)
      assertThat(aggregate.uncommittedChanges()).is([])
      assertThat(aggregate.countOfEvents()).is(0)
    })
  })

  describe('loadFromHistory', () => {

    it('multiple events', async () => {
      const id = Uuid.createV4()
      const event: ChangeEvent = ChangeEventBuilder.make()
        .withAggregateRootId(id)
        .to()

      aggregate.loadFromHistory([
        { version: 0, event },
        { version: 1, event },
        { version: 2, event }
      ])
      assertThat(aggregate.id).is(event.aggregateRootId)
      assertThat(aggregate.changeVersion).is(2)
      assertThat(aggregate.uncommittedChanges()).is([])
      assertThat(aggregate.countOfEvents()).is(3)
    })
  })

  describe('observe', () => {
    const correlationId = Uuid.createV4()
    const causationId = Uuid.createV4()

    let event: ChangeEvent
    beforeEach(() => {
      const id = Uuid.createV4()
      event = ChangeEventBuilder.make()
        .withAggregateRootId(id)
        .withCorrelation(correlationId)
        .to()

    })

    it('change', async () => {
      aggregate.loadFromHistory([{ version: 0, event }])

      const nextEvent = ChangeEventBuilder.make()
        .withAggregateRootId(event.aggregateRootId)
        .to()

      aggregate.rootEntity.applyChangeEvent(nextEvent)

      assertThat(aggregate.id).is(event.aggregateRootId)
      assertThat(aggregate.changeVersion).is(0)

      assertThat(aggregate.uncommittedChanges()).is(match.array.length(1))
      assertThat(aggregate.uncommittedChanges()).is([{ version: 1, event: match.obj.has({id:nextEvent.id}) }])
      assertThat(aggregate.countOfEvents()).is(2)
    })

    it('correlated change', async () => {
      aggregate.loadFromHistory([{ version: 0, event }])

      const nextEvent = ChangeEventBuilder.make()
        .withAggregateRootId(event.aggregateRootId)
        .to()



      aggregate.withCausationMessage(event)
      aggregate.rootEntity.applyChangeEvent(nextEvent)

      assertThat(aggregate.id).is(event.aggregateRootId)
      assertThat(aggregate.changeVersion).is(0)


      const correlatedEvent = {
        ...nextEvent,
        causationId: event.id,
        correlationId: event.correlationId
      }

      assertThat(aggregate.uncommittedChanges()).is([
        { version: 1, event: correlatedEvent }
      ])

      assertThat(aggregate.countOfEvents()).is(2)
    })
    it('change which is committed', async () => {
      aggregate.loadFromHistory([{ version: 0, event }])
      aggregate.rootEntity.applyChangeEvent(event)
      aggregate.markChangesAsCommitted(100)
      assertThat(aggregate.changeVersion).is(100)
      assertThat(aggregate.uncommittedChanges()).is([])
      assertThat(aggregate.countOfEvents()).is(2)
    })
  })
})
