import { assertThat, match } from 'mismatched'
import { Thespian, TMocked } from 'thespian'
import { ChangeEvent, EntityEvent, EventBus, EventStoreRepository } from '.'
import { Uuid } from '..'
import { EventMiddleware, EventStore } from './EventStore'

describe('Event Store', () => {
  let mocks: Thespian
  let repository: TMocked<EventStoreRepository>
  let bus: TMocked<EventBus<EntityEvent>>
  let eventStore: EventStore
  afterAll(() => mocks.verify())
  beforeEach(() => {
    mocks = new Thespian()
    bus = mocks.mock('bus')
    repository = mocks.mock('repository')
    eventStore = new EventStore(repository.object, bus.object)
  })

  it('appends new events and publishes them', async () => {
    const clock = Date.now()
    const aggregateRootId = Uuid.createV4()
    const testEvents = makeEventArray(aggregateRootId, clock, 5)

    repository.setup(x => x.appendEvents(aggregateRootId, 0, testEvents))
    bus.setup(x => x.callHandlers(testEvents))

    await eventStore.appendEvents(aggregateRootId, 0, testEvents)
  })

  it('loads events', async () => {
    const clock = Date.now()
    const aggregateRootId = Uuid.createV4()
    const expectedEvents = makeEventArray(aggregateRootId, clock, 10)
    repository.setup(x => x.getEvents(aggregateRootId)).returns(() => Promise.resolve(expectedEvents))
    const events = await eventStore.getEvents(aggregateRootId)
    assertThat(events).is(match.array.match(events))
  })

  it('loads events from version', async () => {
    const aggregateRootId = Uuid.createV4()
    repository.setup(x => x.getEventsAfterVersion(aggregateRootId, 2)).returns(() => Promise.resolve([]))
    const events = await eventStore.getEventsAfterVersion(aggregateRootId, 2)
    assertThat(events).is([])
  })

  it('registers event listener', () => {
    const handler = (): Promise<void> => Promise.resolve()

    bus.setup(x => x.registerHandlerForEvents(handler))
    eventStore.registerCallback(handler)
  })

  it('calls deserializers after loading events', async () => {
    const clock = Date.now()
    const aggregateRootId = Uuid.createV4()
    const handler: EventMiddleware = (evt: ChangeEvent) => {
      return Promise.resolve({ ...evt, extraField: 'hello' })
    }
    const testEvents = makeEventArray(aggregateRootId, clock, 5)

    repository.setup(x => x.getEvents(aggregateRootId)).returns(() => Promise.resolve(testEvents))
    eventStore.registerEventDeserializer('test-1', handler)
    const events = await eventStore.getEvents(aggregateRootId)

    const chnageEvents = events.map(x => x.event)
    assertThat(chnageEvents).is(match.array.every(match.obj.has({ extraField: 'hello' })))
  })

  it('only calls deserializers for specific event type', async () => {
    const clock = Date.now()
    const aggregateRootId = Uuid.createV4()
    // const handler: EventMiddleware = () => {
    //   return Promise.reject('should not be called')
    // }
    const testEvents = makeEventArray(aggregateRootId, clock, 5)

    repository.setup(x => x.getEvents(aggregateRootId)).returns(() => Promise.resolve(testEvents))
    eventStore.registerEventDeserializer('some-other-event-type', () => Promise.reject('should not be called'))
    const events = await eventStore.getEvents(aggregateRootId)

    assertThat(events).is(testEvents)
  })

  it('handles middleware errors', async () => {
    const clock = Date.now()
    const aggregateRootId = Uuid.createV4()
    const testEvents = makeEventArray(aggregateRootId, clock, 5)

    repository.setup(x => x.getEvents(aggregateRootId)).returns(() => Promise.resolve(testEvents))
    eventStore.registerEventDeserializer('test-1', () => Promise.reject('woops...'))

    return eventStore.getEvents(aggregateRootId).then(
      () => fail('should not get here'),
      fail => assertThat(fail).is('woops...')
    )
  })

  function makeEventArray(aggregateRootId: Uuid.UUID, clock: number, count: number): Array<EntityEvent> {
    const list = []
    while (count-- > 0) {
      list.push(makeEvent(aggregateRootId, clock))
    }
    return list.map((e, i) => ({ version: i, event: e }))
  }
  function makeEvent(aggregateRootId: Uuid.UUID, clock: number): ChangeEvent {
    return {
      id: Uuid.createV4(),
      aggregateRootId: aggregateRootId,
      entityId: aggregateRootId,
      dateTimeOfEvent: new Date(clock).toISOString(),
      eventType: 'test-1'
    }
  }
})
