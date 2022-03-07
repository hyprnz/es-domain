import * as Uuid from '../eventSourcing/UUID'
import {AggregateRootRepository} from './AggregateRootRepository'
import {assertThat, match} from 'mismatched'
import {ChangeEvent, EntityEvent} from '../eventSourcing/MessageTypes'
import {AggregateContainer} from '../eventSourcing/AggregateRootBase'
import {Device} from '../deviceBoundedContext'
import {WriteModelRepository} from './WriteModelRepository'
import {OptimisticConcurrencyError} from "./OptimisticConcurrencyError";
import {InMemoryEventStoreRepository} from "./InMemoryEventStoreRepository";

describe("AggregateRootRepository", () => {

    let repository: WriteModelRepository

    beforeEach(() => {
        repository = new AggregateRootRepository(new InMemoryEventStoreRepository())
    })

    it("stores events", async () => {
        const deviceId = Uuid.createV4()
        const alarmId = Uuid.createV4()

        const deviceAggregate = new AggregateContainer(Device, deviceId)
        deviceAggregate.rootEntity.addAlarm(alarmId)

        const uncommittedEvents = deviceAggregate.uncommittedChanges()

        let emittedEvents: Array<EntityEvent> = []
        const handler = async (changes: Array<EntityEvent>) => {
            emittedEvents = emittedEvents.concat(changes)
            return
        }
        repository.subscribeToChangesSynchronously(changes => handler(changes))

        const countEvents = await repository.save(deviceAggregate)

        assertThat(countEvents).withMessage("Stored Event count").is(2)
        assertThat(emittedEvents).withMessage("Emitted Events").is(match.array.length(2))
        assertThat(uncommittedEvents).is(emittedEvents)
    })

    it("loads events", async () => {
        const deviceId = Uuid.createV4()
        const alarmId = Uuid.createV4()

        const deviceAggregate = new AggregateContainer(Device, deviceId)

        const device = deviceAggregate.rootEntity
        device.addAlarm(alarmId)

        const uncommittedEvents = deviceAggregate.uncommittedChanges()
        await repository.save(deviceAggregate)

        // Compare Saved event to loaded make sure they are thesame
        const loadedEvents = await repository.loadEvents(deviceId)

        assertThat(uncommittedEvents).is(loadedEvents)
        assertThat(loadedEvents).is(match.array.length(2))
    })

    it('detects concurrency issue', async () => {
        const deviceId = Uuid.createV4()
        const alarmId = Uuid.createV4()

        const deviceAggregate = new AggregateContainer(Device, deviceId)

        const device = deviceAggregate.rootEntity
        device.addAlarm(alarmId)

        await repository.save(deviceAggregate)

        const anotherDeviceAggregate = await repository.load(
            deviceId,
            (id) => new AggregateContainer(Device),
        )
        const anotherDevice = anotherDeviceAggregate.rootEntity

        device.addAlarm(Uuid.createV4())
        anotherDevice.addAlarm(Uuid.createV4())

        await repository.save(deviceAggregate)
        await repository.save(anotherDeviceAggregate)
            .then(
                () => fail("Expected and Optimistic concurrency error here!!"),
                (e: any) => {
                    assertThat(e instanceof OptimisticConcurrencyError).is(true)
                    assertThat(e.message).is(`Optimistic concurrency error for aggregate root id: ${device.id}, version: ${2}`)
                }
            )
    })
})