import {ExternalEventStoreRepository} from "./ExternalEventStoreRepository";
import {ExternalEvent} from "../eventSourcing/MessageTypes";
import {ExternalEventBuilder} from "./ExternalEventBuilder";
import {EventStoreExternal} from "./EventStoreExternal";
import {Thespian, TMocked} from "thespian";
import {assertThat} from "mismatched";
import {OptimisticConcurrencyError} from "../writeModelRepository/OptimisticConcurrencyError";
import {EventFailed} from "./EventBusExternalFailure";
import {IdempotencyError} from "./IdempotencyError";

describe("EventStoreExternal", () => {
    let repository: TMocked<ExternalEventStoreRepository>
    let eventStoreExternal: EventStoreExternal
    let thespian: Thespian
    let count = 0
    let errorCount = 0
    const handler = async (events: ExternalEvent[]): Promise<void> => {
        count++
    }
    const errorHandler = async (events: EventFailed[]): Promise<void> => {
        errorCount++
    }

    beforeEach(() => {
        thespian = new Thespian()
        repository = thespian.mock()
        eventStoreExternal = new EventStoreExternal(repository.object)
        count = 0
        errorCount = 0
    })

    describe("process", () => {
        const event: ExternalEvent = ExternalEventBuilder.make().to()

        it("already processed", async () => {
            eventStoreExternal.subscribeToEventsSynchronously(handler)
            eventStoreExternal.subscribeToFailureSynchronously(errorHandler)
            repository.setup(x => x.appendEvent(event)).returns(() => Promise.reject(new IdempotencyError(event.id, event.eventId)))
            await eventStoreExternal.process(event)
            assertThat(count).is(0)
            assertThat(errorCount).is(0)
        })
        it("processed for first time", async () => {
            eventStoreExternal.subscribeToEventsSynchronously(handler)
            eventStoreExternal.subscribeToFailureSynchronously(errorHandler)
            repository.setup(x => x.appendEvent(event)).returns(() => Promise.resolve())
            await eventStoreExternal.process(event)
            assertThat(count).is(1)
            assertThat(errorCount).is(0)
        })
        it("processed for first time but has error appending", async () => {
            eventStoreExternal.subscribeToEventsSynchronously(handler)
            eventStoreExternal.subscribeToFailureSynchronously(errorHandler)
            repository.setup(x => x.appendEvent(event)).returns(() => Promise.reject(new Error(`Ooops`)))
            await eventStoreExternal.process(event)
            assertThat(count).is(0)
            assertThat(errorCount).is(1)
        })
        it("processed for first time but has error handling", async () => {
            eventStoreExternal.subscribeToEventsSynchronously(() => Promise.reject(new Error(`Oooops`)))
            eventStoreExternal.subscribeToFailureSynchronously(errorHandler)
            repository.setup(x => x.appendEvent(event)).returns(() => Promise.resolve())
            await eventStoreExternal.process(event)
            assertThat(count).is(0)
            assertThat(errorCount).is(1)
        })
        it("processed for first time but has error handling and in failed subscriber", async () => {
            eventStoreExternal.subscribeToEventsSynchronously(handler)
            eventStoreExternal.subscribeToEventsSynchronously(handler)
            eventStoreExternal.subscribeToEventsSynchronously(() => Promise.reject(new Error(`Oooops`)))
            eventStoreExternal.subscribeToFailureSynchronously(() => Promise.reject(new Error(`Doh`)))
            repository.setup(x => x.appendEvent(event)).returns(() => Promise.resolve())
            return eventStoreExternal.process(event).then(() => {
                throw new Error('Should not get here')
            }, (e: any) => {
                assertThat(e.message).is(`Event bus error for event with id: ${event.id} eventId: ${event.eventId} for eventType: ${event.eventType} errors: Doh`)
                assertThat(count).is(2)
                assertThat(errorCount).is(0)
            })
        })
    })

})
