import {
  BulkOperationType,
  Container,
  CreateOperationInput,
  JSONObject,
  StatusCodes,
  OperationResponse
} from "@azure/cosmos";
import EventEmitter from "events";
import { Aggregate } from "../../eventSourcing/AggregateEntity";
import { ChangeEvent, EntityEvent } from "../../eventSourcing/MessageTypes";

import * as Uuid from "../../eventSourcing/UUID";
import { WriteModelRepository } from "../../writeModelRepository/WriteModelRepository";
import {OptimisticConcurrencyError} from "../../writeModelRepository/OptimisticConcurrencyError";


// Flatterened version of event ?
// Do we need to do this
type EventStoreModel = ChangeEvent & { version: number };

export class WriteModelCosmosSqlRepository implements WriteModelRepository {
  private readonly eventEmitter = new EventEmitter();
  constructor(private store: Container) {}

  async save<T extends Aggregate>(aggregateRoot: T): Promise<number> {
    const changes = aggregateRoot.uncommittedChanges();
    if (changes.length === 0) return Promise.resolve(0);

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
      aggregateRoot.id
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
        throw new OptimisticConcurrencyError(aggregateRoot.id, aggregateRoot.changeVersion);
      }
    }

    const lastChange = changes[changes.length - 1];
    aggregateRoot.markChangesAsCommitted(lastChange.version);
    this.onAfterEventsStored(changes);
    return changes.length;
  }

  async load<T extends Aggregate>(id: Uuid.UUID, activator: (id: Uuid.UUID) => T): Promise<T> {
    const events = await this.loadEvents(id);
    const found = !!events;
    if (!found)
      throw new WriteModelRepositoryError(
        activator.name,
        `Failed to load aggregate id:${id}: NOT FOUND`
      );

    const aggregate = activator(id);
    aggregate.loadFromHistory(events);
    return aggregate;
  }

  loadEvents(id: Uuid.UUID): Promise<EntityEvent[]> {
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

  subscribeToChangesSynchronously(handler: (changes: Array<EntityEvent>) => void) {
    this.eventEmitter.addListener("events", handler);
  }

  private onAfterEventsStored(changes: Array<EntityEvent>) {
    if (changes.length) {
      this.eventEmitter.emit("events", changes);
    }
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

  private toPersistable(clock: string, change: EntityEvent): JSONObject {
    return {
      version: change.version,
      // dateTimeOfEvent: clock,

      ...change.event,
    };
  }
}

class WriteModelRepositoryError extends Error {
  constructor(domainObjName: string, description: string) {
    super(`Error:${domainObjName}, ${description}`);
  }
}
