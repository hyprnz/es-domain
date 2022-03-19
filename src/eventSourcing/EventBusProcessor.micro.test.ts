import { ExternalEvent } from './MessageTypes'
import { assertThat } from 'mismatched'
import { EventBusProcessor } from './EventBusProcessor'
import { ExternalEventBuilder } from '../eventStoreExternal/ExternalEventBuilder'

describe('EventBusProcessor', () => {
  let bus: EventBusProcessor<ExternalEvent>
  let count = 0
  let errors = 0
  const handler = async (events: ExternalEvent[]): Promise<void> => {
    count++
  }
  const handlerThatThrows = async (events: ExternalEvent[]): Promise<void> => {
    errors++
    throw new Error(`Oooops`)
  }
  beforeEach(() => {
    bus = new EventBusProcessor()
    count = 0
  })

  describe('callHandlers', () => {
    const event: ExternalEvent = ExternalEventBuilder.make().to()
    it('multiple events single handle', async () => {
      bus.registerHandlerForEvents(handler)
      await bus.callHandlers([event, event, event])
      assertThat(count).is(1)
    })
    it('multiple events multiple handles', async () => {
      bus.registerHandlerForEvents(handler)
      await bus.callHandlers([event])
      await bus.callHandlers([event])
      await bus.callHandlers([event])
      assertThat(count).is(3)
    })
    it('with error', async () => {
      bus.registerHandlerForEvents(handlerThatThrows)
      return bus.callHandlers([event]).then(
        () => {
          throw new Error('Should not get here')
        },
        (err: any) => {
          assertThat(err.message).is(`Event bus error for events: ${JSON.stringify(event)} errors: Oooops`)
          assertThat(count).is(0)
          assertThat(errors).is(1)
        }
      )
    })
  })
})
