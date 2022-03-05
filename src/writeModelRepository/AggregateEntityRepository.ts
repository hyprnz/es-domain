import * as Uuid from '../eventSourcing/UUID'
import {UUID} from '../eventSourcing/UUID'
import EventEmitter from "events";
import {EntityEvent} from "../eventSourcing/MessageTypes";
import {WriteModelRepositoryError as WriteModelRepositoryError} from "./WriteModelRepositoryError";
import {WriteModelRepository} from './WriteModelRepository';
import {AggregateEntity} from "../eventSourcing/AggregateEntity";
import {OptimisticConcurrencyError} from "./OptimisticConcurrencyError";
import {InternalEventStoreRepository} from "./InternalEventStoreRepository";

export class AggregateEntityRepository implements WriteModelRepository {
    private readonly eventEmitter = new EventEmitter();

    constructor(private readonly eventStore: InternalEventStoreRepository) {
    }

    async save<T extends AggregateEntity>(aggregateRoot: T): Promise<number> {
        const changes = aggregateRoot.uncommittedChanges()
        if (changes.length === 0) return Promise.resolve(0)
        const committedEvents = await this.eventStore.getEvents(aggregateRoot.id)
        const found = committedEvents.length > 0
        if (found) {
            const committedVersion = committedEvents[committedEvents.length - 1].version + 1
            const firstUncommittedChangeVersion = changes[0].version
            if (committedVersion !== firstUncommittedChangeVersion) {
                const error = new OptimisticConcurrencyError(aggregateRoot.id, committedVersion, firstUncommittedChangeVersion)
                return Promise.reject(error)
            }
        }

        // Insert vs update
        if (found) committedEvents.push(...changes)
        else await this.eventStore.appendEvents(aggregateRoot.id, changes)

        const lastChange = changes[changes.length - 1]
        aggregateRoot.markChangesAsCommitted(lastChange.version);
        this.onAfterEventsStored(changes)
        return Promise.resolve(changes.length)
    }

    async load<T extends AggregateEntity>(id: UUID, activator: (id: Uuid.UUID) => T): Promise<T> {
        const events = await this.eventStore.getEvents(id)
        const found = !!events
        if (!found) throw new WriteModelRepositoryError(activator.name, `Failed to load aggregate id:${id}: NOT FOUND`)

        const aggregate = activator(id)
        aggregate.loadFromHistory(events)
        return Promise.resolve(aggregate)
    }

    async loadEvents(id: UUID): Promise<Array<EntityEvent>> {
        return await this.eventStore.getEvents(id)
    }

    subscribeToChanges(handler: (changes: Array<EntityEvent>) => void) {
        this.eventEmitter.addListener('events', handler)
    }

    private onAfterEventsStored(changes: Array<EntityEvent>) {
        if (changes.length) {
            this.eventEmitter.emit('events', changes)
        }
    }
}

