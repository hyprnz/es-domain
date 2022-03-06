import { assertThat, match } from "mismatched";
import { CosmosClient, CosmosClientOptions } from "@azure/cosmos";
import { WriteModelCosmosSqlRepository } from "./WriteModelCosmosSqlRepository";

import * as Uuid from "../../eventSourcing/UUID";
import { Device } from "../../deviceBoundedContext/domain/Device"
import { makeMigrator } from "./migrate";
import { AggregateContainer } from "../../eventSourcing/AggregateRootBase";
import { EntityEvent } from "../../eventSourcing/MessageTypes";

describe("WriteModelCosmosSqlRepository", () => {
  let writeModelRepo: WriteModelCosmosSqlRepository;
  beforeAll(async () => {
    const databaseId = 'testdb'
    const containerName = 'eventstore'

    const options: CosmosClientOptions = {endpoint: 'localhost', key: 'some-key'}
    const client = new CosmosClient(options);

    const migrate = makeMigrator(client, databaseId, containerName)
    await migrate.up()
    
    const database = client.database(databaseId);
    const container = database.container(containerName);

    writeModelRepo = new WriteModelCosmosSqlRepository(container);
  });

  it("stores events", async () => {
    const deviceId = Uuid.createV4();
    const alarmId = Uuid.createV4();

    const deviceAggregate = new AggregateContainer(Device, deviceId);
    deviceAggregate.rootEntity.addAlarm(alarmId);

    const uncomittedEvents = deviceAggregate.uncommittedChanges();

    const emittedEvents: Array<EntityEvent> = [];
    writeModelRepo.subscribeToChangesSynchronously((changes) =>
      changes.forEach((x) => emittedEvents.push(x))
    );

    const countEvents = await writeModelRepo.save(deviceAggregate);

    assertThat(countEvents).withMessage("Stored Event count").is(2);
    assertThat(emittedEvents)
      .withMessage("Emitted Events")
      .is(match.array.length(2));
    assertThat(uncomittedEvents).is(emittedEvents);
  });

  it("loads events", async () => {
    const deviceId = Uuid.createV4();
    const alarmId = Uuid.createV4();

    const deviceAggregate = new AggregateContainer(Device, deviceId)

    const device = deviceAggregate.rootEntity;
    device.addAlarm(alarmId);

    const uncomittedEvents = deviceAggregate.uncommittedChanges();
    await writeModelRepo.save(deviceAggregate);

    // Compare Saved event to loaded make sure they are thesame
    const loadedEvents = await writeModelRepo.loadEvents(deviceId);

    assertThat(loadedEvents).is(match.array.length(2));
    assertThat(uncomittedEvents).is(loadedEvents);
  });

  it("detects concurrency", async () => {
    const deviceId = Uuid.createV4();
    const alarmId = Uuid.createV4();

    const deviceAggregate = new AggregateContainer(Device, deviceId);
    const device = deviceAggregate.rootEntity;
    device.addAlarm(alarmId);
    await writeModelRepo.save(deviceAggregate);

    const anotherDeviceAggregate = await writeModelRepo.load(
      deviceId,
      () => new AggregateContainer(Device, deviceId)
    );
    const anotherDevice = anotherDeviceAggregate.rootEntity;

    // Make changes to both
    device.addAlarm(Uuid.createV4());
    anotherDevice.addAlarm(Uuid.createV4());

    assertThat(deviceAggregate.changeVersion)
      .withMessage("deviceAggregate version")
      .is(1);
    assertThat(anotherDeviceAggregate.changeVersion)
      .withMessage("anotherDeviceAggregate version")
      .is(1);

    assertThat(deviceAggregate.uncommittedChanges()).is(match.array.length(1));
    assertThat(anotherDeviceAggregate.uncommittedChanges()).is(
      match.array.length(1)
    );

    assertThat(deviceAggregate.uncommittedChanges()[0].version)
      .withMessage("UnCommited device")
      .is(2);
    assertThat(anotherDeviceAggregate.uncommittedChanges()[0].version)
      .withMessage("UnCommited anotherDevice")
      .is(2);

    assertThat(deviceAggregate.uncommittedChanges()[0].event.aggregateRootId)
      .withMessage("UnCommited device")
      .is(deviceId);
    assertThat(
      anotherDeviceAggregate.uncommittedChanges()[0].event.aggregateRootId
    )
      .withMessage("UnCommited anotherDevice")
      .is(deviceId);

    await writeModelRepo.save(deviceAggregate);
    await writeModelRepo.save(anotherDeviceAggregate).then(
      () => {
        throw new Error("Expected and Optimistic concurrency error here!!");
      },
      (e) =>
        assertThat(e.message).is(
          `Error:AggregateRoot, Optimistic concurrency error detected, Suggested solution is to retry`
        )
    );
  });
});
