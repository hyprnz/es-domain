import {ExternalEventStoreRepository} from "./ExternalEventStoreRepository";
import {ExternalEvent} from "../eventSourcing/MessageTypes";
import {ExternalEventBuilder} from "./ExternalEventBuilder";
import {EventStoreExternal, ExternalEventStoreProcessingState} from "./EventStoreExternal";
import {Thespian, TMocked} from "thespian";

describe("EventStoreExternal", () => {
    let repository: TMocked<ExternalEventStoreRepository>
    let eventStoreExternal: EventStoreExternal
    let thespian: Thespian

    beforeEach(() => {
        thespian = new Thespian()
        repository = thespian.mock()
        eventStoreExternal = new EventStoreExternal(repository.object)
    })

    describe("process", () => {
        const event: ExternalEvent = ExternalEventBuilder.make().to()

        it("already processed", async () => {
            repository.setup(x => x.exists(event.eventId)).returns(() => Promise.resolve(true))
            await eventStoreExternal.process(event, () => Promise.resolve())
        })
        it("processed for first time", async () => {
            repository.setup(x => x.exists(event.eventId)).returns(() => Promise.resolve(false))
            repository.setup(x => x.append(event)).returns(() => Promise.resolve())
            repository.setup(x => x.markAsProcessed(event.eventId)).returns(() => Promise.resolve())
            await eventStoreExternal.process(event, () => Promise.resolve())
        })
        it("processed for first time but has error appending", async () => {
            repository.setup(x => x.exists(event.eventId)).returns(() => Promise.resolve(false))
            repository.setup(x => x.append(event)).returns(() => Promise.reject(new Error(`Ooops`)))
            repository.setup(x => x.recordProcessingFailure(event.eventId, ExternalEventStoreProcessingState.RECEIVED)).returns(() => Promise.resolve())
            await eventStoreExternal.process(event, () => Promise.resolve())
        })
        it("processed for first time but has error handling", async () => {
            repository.setup(x => x.exists(event.eventId)).returns(() => Promise.resolve(false))
            repository.setup(x => x.append(event)).returns(() => Promise.resolve())
            repository.setup(x => x.recordProcessingFailure(event.eventId, ExternalEventStoreProcessingState.APPENDED)).returns(() => Promise.resolve())
            await eventStoreExternal.process(event, () => Promise.reject(new Error(`Ooops`)))
        })
        it("processed for first time but has error marking as processed", async () => {
            repository.setup(x => x.exists(event.eventId)).returns(() => Promise.resolve(false))
            repository.setup(x => x.append(event)).returns(() => Promise.resolve())
            repository.setup(x => x.markAsProcessed(event.eventId)).returns(() => Promise.reject(new Error(`Ooops`)))
            repository.setup(x => x.recordProcessingFailure(event.eventId, ExternalEventStoreProcessingState.HANDLED)).returns(() => Promise.resolve())
            await eventStoreExternal.process(event, () => Promise.resolve())
        })
    })

})
