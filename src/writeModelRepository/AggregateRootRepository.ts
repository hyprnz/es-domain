import * as Uuid from '../eventSourcing/UUID'
import {UUID} from '../eventSourcing/UUID'
import EventEmitter from "events";
import {EntityEvent} from "../eventSourcing/MessageTypes";
import {WriteModelRepositoryError as WriteModelRepositoryError} from "./WriteModelRepositoryError";
import {WriteModelRepository} from './WriteModelRepository';
import {Aggregate} from "../eventSourcing/Aggregate";
import {InternalEventStoreRepository} from "./InternalEventStoreRepository";
import {EventBusInternal} from "../eventSourcing/EventBusInternal";

export class AggregateRootRepository implements WriteModelRepository {
    private readonly eventEmitter = new EventEmitter();

    constructor(private readonly eventStore: InternalEventStoreRepository,
                private readonly eventBusSync = new EventBusInternal(),
    ) {
    }

    async save<T extends Aggregate>(aggregateRoot: T): Promise<number> {
        const changes = aggregateRoot.uncommittedChanges()
        if (changes.length === 0) {
            return Promise.resolve(0)
        }
        await this.eventStore.appendEvents(aggregateRoot.id, changes[0].version, changes)
        aggregateRoot.markChangesAsCommitted(changes[changes.length - 1].version);
        await this.onAfterEventsStored(changes)
        return changes.length
    }

    async load<T extends Aggregate>(id: UUID, aggregate: T): Promise<T> {
        const events = await this.eventStore.getEvents(id)
        if (events.length === 0) {
            throw new WriteModelRepositoryError("AggregateContainer", `Failed to load aggregate id:${id}: NOT FOUND`)
        }
        aggregate.loadFromHistory(events)
        return Promise.resolve(aggregate)
    }

    async loadEvents(id: UUID): Promise<Array<EntityEvent>> {
        return await this.eventStore.getEvents(id)
    }

    subscribeToChangesSynchronously(handler: (changes: Array<EntityEvent>) => Promise<void>) {
        this.eventBusSync.registerHandlerForEvents(handler)
    }

    subscribeToChangesAsynchronously(handler: (changes: Array<EntityEvent>) => Promise<void>): void {
        this.eventEmitter.addListener('events', handler)
    }

    private async onAfterEventsStored(changes: Array<EntityEvent>): Promise<void> {
        if (changes.length === 0) return
        await this.eventBusSync.callHandlers(changes)
        this.eventEmitter.emit('events', changes)
    }
}

