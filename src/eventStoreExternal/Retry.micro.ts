import { assertThat } from 'mismatched'
import { OptimisticConcurrencyError } from '../eventSourcing/contracts/OptimisticConcurrencyError'
import { makeNoOpLogger } from '../util/Logger'
import { WriteModelRepositoryError } from '../writeModelRepository/WriteModelRepositoryError'
import { delay, retryOnSpecificErrors } from './Retry'

const logger = makeNoOpLogger()

describe('retry and retryOnTimeout', () => {
  class TestWithException {
    public counter = 0

    run(passOnCallCount: number): Promise<any> {
      this.counter++
      return passOnCallCount === this.counter ? Promise.resolve(100) : Promise.reject(new Error('ooooops'))
    }

    runWithOptimisticError(passOnCallCount: number): Promise<any> {
      this.counter++
      return passOnCallCount === this.counter ? Promise.resolve(100) : Promise.reject(new OptimisticConcurrencyError('1', 2))
    }
  }

  let test: TestWithException

  beforeEach(() => {
    test = new TestWithException()
  })

  describe('retry', () => {
    it('no problem no retry', () => {
      return retryOnSpecificErrors(() => test.run(1), logger, [], 2, 1, 'act').then(result => {
        assertThat(result).is(100)
        assertThat(test.counter).is(1)
      })
    })

    it('one problem one retry', () => {
      return retryOnSpecificErrors(() => test.run(2), logger, [Error], 2, 1, 'act').then(result => {
        assertThat(result).is(100)
        assertThat(test.counter).is(2)
      })
    })

    it('error retries then catches', () => {
      return retryOnSpecificErrors(() => test.run(100), logger, [Error], 2, 1, 'act').catch(e => {
        assertThat(e.message).is('ooooops')
        assertThat(test.counter).is(3)
      })
    })

    it('error retries then catches on specific error', () => {
      return retryOnSpecificErrors(
        () => test.runWithOptimisticError(100),
        logger,
        [OptimisticConcurrencyError],
        2,
        1,
        'act'
      ).catch(e => {
        assertThat(e.message).is('Optimistic concurrency error for aggregate root id: 1, version: 2')
        assertThat(test.counter).is(3)
      })
    })

    it('error does not retry when different specific error', () => {
      return retryOnSpecificErrors(
        () => test.runWithOptimisticError(100),
        logger,
        [WriteModelRepositoryError],
        2,
        1,
        'act'
      ).catch(e => {
        assertThat(e.message).is('Optimistic concurrency error for aggregate root id: 1, version: 2')
        assertThat(test.counter).is(1)
      })
    })

    describe('delay', () => {
      let test: TestWithException

      beforeEach(() => {
        test = new TestWithException()
      })

      it('delay', () => {
        return delay(1, 1234).then(result => assertThat(result).is(1234))
      })
    })
  })
})
