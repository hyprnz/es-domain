import {
    BulkOperationType,
    Container,
    CreateOperationInput,
    JSONObject,
    OperationResponse,
    StatusCodes
} from "@azure/cosmos";
import EventEmitter from "events";
import {Aggregate} from "../../eventSourcing/Aggregate";
import {ChangeEvent, EntityEvent} from "../../eventSourcing/MessageTypes";

import * as Uuid from "../../eventSourcing/UUID";
import {UUID} from "../../eventSourcing/UUID";
import {WriteModelRepository} from "../../writeModelRepository/WriteModelRepository";
import {OptimisticConcurrencyError} from "../../writeModelRepository/OptimisticConcurrencyError";
import {WriteModelRepositoryError} from "../../writeModelRepository/WriteModelRepositoryError";
import {InternalEventStoreRepository} from "../../writeModelRepository/InternalEventStoreRepository";

// Flattened version of event ?
// Do we need to do this
type EventStoreModel = ChangeEvent & { version: number };

export class WriteModelCosmosSqlRepository implements WriteModelRepository {
    private readonly eventEmitter = new EventEmitter();
    private readonly adapter: CosmosAdapter

    constructor(store: Container) {
        this.adapter = new CosmosAdapter(store)
    }

    async save<T extends Aggregate>(aggregateRoot: T): Promise<number> {
        const changes = aggregateRoot.uncommittedChanges();
        if (changes.length === 0) return Promise.resolve(0);
        const lastChange = changes[changes.length - 1];
        await this.adapter.appendEvents(aggregateRoot.id, lastChange.version, changes)
        aggregateRoot.markChangesAsCommitted(lastChange.version);
        this.onAfterEventsStored(changes);
        return changes.length;
    }

    async load<T extends Aggregate>(id: Uuid.UUID, aggregate: T): Promise<T> {
        const events = await this.loadEvents(id);
        if (events.length === 0) {
            throw new WriteModelRepositoryError(
                "AggregateContainer",
                `Failed to load aggregate id:${id}: NOT FOUND`
            );
        }
        aggregate.loadFromHistory(events);
        return aggregate;
    }

    loadEvents(id: Uuid.UUID): Promise<EntityEvent[]> {
        return this.adapter.getEvents(id)
    }

    subscribeToChangesSynchronously(handler: (changes: Array<EntityEvent>) => void) {
        this.eventEmitter.addListener("events", handler);
    }

    private onAfterEventsStored(changes: Array<EntityEvent>) {
        if (changes.length) {
            this.eventEmitter.emit("events", changes);
        }
    }
}


export class CosmosAdapter implements InternalEventStoreRepository {
    constructor(private store: Container) {
    }

    async appendEvents(aggregateId: UUID, changeVersion: number, changes: EntityEvent[]): Promise<void> {
        // const options = {
        //   disableAutomaticIdGeneration: true,
        //   consistencyLevel: 'Eventual'
        // }
        const clock = new Date().toISOString();
        const models = changes.map((x) => this.toPersistable(clock, x));
        const operations: Array<CreateOperationInput> = models.map((x) => ({
            // partitionKey: aggregateRoot.id,
            operationType: BulkOperationType.Create,
            resourceBody: x,
        }));

        // NOTE: Batch sizes are limited to 100!!
        const statusResult = await this.store.items.batch(
            operations,
            aggregateId
        );

        const code = statusResult.code ?? 200;
        if (code >= 400) {
            throw new WriteModelRepositoryError(
                "AggregateRoot",
                `Cosmos Db Error: ${code}`
            );
        }

        if (code === 207) {
            const isConflicted = statusResult.result.some((x: OperationResponse) => x.statusCode === StatusCodes.Conflict);
            if (isConflicted) {
                throw new OptimisticConcurrencyError(aggregateId, changeVersion);
            }
        }
    }

    getEvents(id: UUID): Promise<EntityEvent[]> {
        return this.store.items
            .query<EventStoreModel>({
                query: "SELECT * FROM EventStore e WHERE e.aggregateRootId = @aggregateRootId order by e.version asc",
                parameters: [
                    {
                        name: "@aggregateRootId",
                        value: id,
                    },
                ],
            })
            .fetchAll()
            .then((result) => result.resources.map(this.toEntityEvent));

    }

    private toPersistable(clock: string, change: EntityEvent): JSONObject {
        return {
            version: change.version,
            // dateTimeOfEvent: clock,

            ...change.event,
        };
    }

    // Maybe these should be injected ?
    private toEntityEvent(x: EventStoreModel): EntityEvent {
        const result = {
            version: x.version,
            event: {
                ...x,
                id: x.id,
                aggregateRootId: x.aggregateRootId,
                entityId: x.entityId,
                eventType: x.eventType,
            },
        };

        // TODO : We have no generic way of detecting dates
        Object.keys(result.event)
            .filter((key) => key.startsWith("_")) //Remove some cosmos built in properties, the structures we use for persisting may be adjusted ?
            .concat("version")
            .forEach((key) => delete (result.event as Record<string, unknown>)[key]);

        console.log("To EntityEvent", JSON.stringify(result));
        return result;
    }
}
