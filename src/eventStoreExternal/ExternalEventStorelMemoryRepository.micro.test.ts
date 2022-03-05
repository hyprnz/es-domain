import * as Uuid from '../eventSourcing/UUID'
import {assertThat} from 'mismatched'
import {ExternalEventStoreInMemoryRepository} from "./ExternalEventStoreInMemoryRepository";
import {ExternalEventStoreRepository} from "./ExternalEventStoreRepository";
import {ExternalEvent} from "../eventSourcing/MessageTypes";
import {ExternalEventBuilder} from "./ExternalEventBuilder";

describe("ExternalEventStoreInMemoryRepository", () => {
    let externalEventStoreRepository: ExternalEventStoreRepository = new ExternalEventStoreInMemoryRepository()

    beforeEach(() => {
        externalEventStoreRepository = new ExternalEventStoreInMemoryRepository()
    })

    describe("exists", () => {
        it("not present", async () => {
            const eventId = Uuid.createV4()
            const exists = await externalEventStoreRepository.exists(eventId)
            assertThat(exists).is(false)
        })
        it("is present", async () => {
            const event: ExternalEvent = ExternalEventBuilder.make().to()
            await externalEventStoreRepository.append(event)
            const exists = await externalEventStoreRepository.exists(event.eventId)
            assertThat(exists).is(true)
        })
    })

    describe("markAsProcessed", () => {
        it("adds event", async () => {
            const event: ExternalEvent = ExternalEventBuilder.make().to()
            await externalEventStoreRepository.append(event)
            await externalEventStoreRepository.markAsProcessed(event.eventId)
        })
    })

})
