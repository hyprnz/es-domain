import { assertThat } from 'mismatched'
import { AggregateContainer } from '.'
import { SnapshotStrategyBuilder } from './snapshotStrategyBuilder'
import { TestEntity } from './TestEntity'

describe('snapshotStrategyBuilder', () => {
  describe('snapshotAfterCountOfEvents', () => {
    it('error', () => {
      assertThat(() => SnapshotStrategyBuilder.afterCountOfEvents(0)).throwsError('Interval must be greater than 0')
    })
    it('no', () => {
      const strategy = SnapshotStrategyBuilder.afterCountOfEvents(2)
      const container = new AggregateContainer(TestEntity)

      assertThat(strategy.shouldSnapshot(container, { clock: 100 })).is(false)
    })
    it('yes', () => {
      const strategy = SnapshotStrategyBuilder.afterCountOfEvents(2)
      const container = new AggregateContainer(TestEntity)
      const aggregate = container.createNewAggregateRoot({ id: '1' })
      aggregate.doSomething()

      assertThat(strategy.shouldSnapshot(container, { clock: 100 })).is(true)
    })
  })
})
