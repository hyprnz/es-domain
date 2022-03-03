import { assertThat, match } from "mismatched";
import { Device } from "../deviceBoundedContext";
import {
  AlarmArmedEvent,
  AlarmCreatedEvent,
  AlarmDestroyedEvent,
  DeviceCreatedEvent,
} from "../deviceBoundedContext/events";
import { Aggregate } from "./Aggregate";
import { ParentAggregate } from "./EventSourcingTypes";
import { createV4, UUID } from "./UUID";

describe("Aggregate", () => {
  const makeDevice = (id: UUID, aggregate: ParentAggregate) =>
    new Device(aggregate, id);

  describe("Root entities", () => {
    it("Can create a root entity", () => {
      const id = createV4();
      const deviceAggregate = new Aggregate(id, makeDevice);

      deviceAggregate.rootEntity.initialise();

      const uncommited = deviceAggregate.uncommittedChanges();
      assertThat(uncommited).is([
        {
          event: {
            ...new DeviceCreatedEvent(id),
            id: match.any(),
          },
          version: 0,
        },
      ]);
    });

    it("Can hydrate a root entity from events", () => {
      const id = createV4();
      const deviceCreated = new DeviceCreatedEvent(id);
      const events = [{ event: deviceCreated, version: 0 }];

      const deviceAggregate = new Aggregate(id, makeDevice);
      deviceAggregate.loadFromHistory(events);

      // accessing private `initialised` property...
      // @ts-ignore
      assertThat(deviceAggregate.rootEntity.initialised).is(true);

      const uncommited = deviceAggregate.uncommittedChanges();
      assertThat(uncommited).is([]);
    });
  });

  describe("Child Entities", () => {
    it("Can add and mutate a child entity", () => {
      const id = createV4();
      const alarmId = createV4();

      const deviceAggregate = new Aggregate(id, makeDevice);
      const device = deviceAggregate.rootEntity;
      device.initialise(); // +1 Event
      const alarm = device.addAlarm(alarmId); // +1 Event
      alarm.armAlarm(20); // +1 Event
      device.destroyAlarm(alarm); //+1 Event

      const uncommited = deviceAggregate.uncommittedChanges();
      assertThat(uncommited).is([
        {
          event: {
            ...new DeviceCreatedEvent(id),
            id: match.any(),
          },
          version: 0,
        },
        {
          event: {
            ...new AlarmCreatedEvent(id, id, { alarmId }),
            id: match.any(),
          },
          version: 1,
        },
        {
          event: {
            ...new AlarmArmedEvent(id, alarmId, { threshold: 20 }),
            id: match.any(),
          },
          version: 2,
        },
        {
          event: {
            ...new AlarmDestroyedEvent(id, id, { alarmId }),
            id: match.any(),
          },
          version: 3,
        },
      ]);
    });

    it("Can hydrate child entities from events", () => {
      const id = createV4();
      const alarmId = createV4();
      const deviceCreated = new DeviceCreatedEvent(id);
      const alarmAdded = new AlarmCreatedEvent(id, id, { alarmId });
      const alarmArmed = new AlarmArmedEvent(id, alarmId, { threshold: 15 });
      const eventHistory = [
        { event: deviceCreated, version: 0 },
        { event: alarmAdded, version: 1 },
        { event: alarmArmed, version: 2 },
      ];

      const deviceAggregate = new Aggregate(id, makeDevice);
      deviceAggregate.loadFromHistory(eventHistory);

      const alarm = deviceAggregate.rootEntity.findAlarm(alarmId);

      // accessing private isArmed property...
      // @ts-ignore
      assertThat(alarm.isArmed).is(true);
    });
  });
});
