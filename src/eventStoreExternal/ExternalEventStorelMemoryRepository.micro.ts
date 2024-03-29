import { assertThat } from 'mismatched'
import { ExternalEvent } from './ExternalEvent'
import { ExternalEventBuilder } from './ExternalEventBuilder'
import { ExternalEventStoreInMemoryRepository } from './ExternalEventStoreInMemoryRepository'
import { ExternalEventStoreRepository } from './ExternalEventStoreRepository'
import { IdempotencyError } from './IdempotencyError'

describe('ExternalEventStoreInMemoryRepository', () => {
  let externalEventStoreRepository: ExternalEventStoreRepository = new ExternalEventStoreInMemoryRepository()

  beforeEach(() => {
    externalEventStoreRepository = new ExternalEventStoreInMemoryRepository()
  })

  describe('appendEvent', () => {
    it('not present', async () => {
      const event: ExternalEvent = ExternalEventBuilder.make().to()
      await externalEventStoreRepository.appendEvent(event)
    })
    it('is present', async () => {
      const event: ExternalEvent = ExternalEventBuilder.make().to()
      await externalEventStoreRepository.appendEvent(event)
      return externalEventStoreRepository.appendEvent(event).then(
        () => {
          throw new Error('Should not get here')
        },
        (err: any) => {
          assertThat(err instanceof IdempotencyError).is(true)
        }
      )
    })
  })
})
