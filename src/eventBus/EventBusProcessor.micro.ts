import { assertThat } from 'mismatched'
import { EventBusProducer } from './EventBusProducer'
import { EventBus } from '../writeModelRepository/EventBus'
import { ChangeEventBuilder, EntityEvent } from '../eventSourcing'

describe('EventBusProcessor', () => {
  let bus: EventBus<EntityEvent>
  let count = 0
  let errors = 0
  const handler = async (events: EntityEvent[]): Promise<void> => {
    count++
  }
  const handlerThatThrows = async (events: EntityEvent[]): Promise<void> => {
    errors++
    throw new Error(`Oooops`)
  }
  beforeEach(() => {
    bus = new EventBusProducer()
    count = 0
  })

  describe('callHandlers', () => {
    const entityEvent: EntityEvent = {version: 0, event: ChangeEventBuilder.make().to()}
    it('multiple events single handle', async () => {
      bus.registerHandlerForEvents(handler)
      await bus.callHandlers([entityEvent, entityEvent, entityEvent])
      assertThat(count).is(1)
    })
    it('multiple events multiple handles', async () => {
      bus.registerHandlerForEvents(handler)
      await bus.callHandlers([entityEvent])
      await bus.callHandlers([entityEvent])
      await bus.callHandlers([entityEvent])
      assertThat(count).is(3)
    })
    it('with error', async () => {
      bus.registerHandlerForEvents(handlerThatThrows)
      return bus.callHandlers([entityEvent]).then(
        () => {
          throw new Error('Should not get here')
        },
        (err: any) => {
          assertThat(err.message).is(`Event bus error for events: ${JSON.stringify(entityEvent)} errors: Oooops`)
          assertThat(count).is(0)
          assertThat(errors).is(1)
        }
      )
    })
  })
})
