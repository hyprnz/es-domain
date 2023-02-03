import { assertThat } from 'mismatched'
import { EventBusExternal } from './EventBusExternal'
import { ExternalEvent } from './ExternalEvent'
import { ExternalEventBuilder } from './ExternalEventBuilder'

describe('EventBusExternal', () => {
  let bus: EventBusExternal

  beforeEach(() => {
    bus = new EventBusExternal()
  })

  describe('callHandlers', () => {
    const event: ExternalEvent = ExternalEventBuilder.make().to()
    it('single event multiple times', async () => {
      let count = 0
      const handler = async (events: ExternalEvent[]): Promise<void> => {
        count++
      }

      bus.registerHandlerForEvents(handler)
      await bus.callHandlers([event])
      await bus.callHandlers([event])
      await bus.callHandlers([event])

      assertThat(count).is(3)
    })
    it('multiple events', async () => {
      let count = 0
      const handler = async (events: ExternalEvent[]): Promise<void> => {
        count += events.length
      }

      bus.registerHandlerForEvents(handler)
      await bus.callHandlers([event, event, event])

      assertThat(count).is(3)
    })
  })
})
