import * as Uuid from '../EventSourcing/UUID'
import { DeviceAggregateRoot } from "./DeviceAggregateRoot"
import { assertThat, match } from "mismatched";
import * as deviceEvents from './events/deviceEvents'
import { IEntityAggregate, IChangeEvent, IEntityEvent, UNINITIALISED_AGGREGATE_VERSION, IAggregateRoot } from '../EventSourcing/EventSourcingTypes';
import { AlarmTriggeredEvent } from './events/deviceEvents';
import { GenericAggregateRoot } from '../EventSourcing/AggregateRoot';
import { Device, DeviceEntity } from '.';

describe('Device', () => {
  describe('DeviceAggregateRoot', () => {
    describe('Event Sourceing Basics', () => {
      it('Uninitilaised', () => {
        const device = new DeviceAggregateRoot()
        assertThat(device.uncommittedChanges()).is([])
        assertThat(device.changeVersion).is(UNINITIALISED_AGGREGATE_VERSION)
      })

      it('Create New Device', () => {
        const id = Uuid.createV4()
        const device = new DeviceAggregateRoot(id)
        const events = device.uncommittedChanges()
        assertThat(events).is([
          makeEntityEventMatcher(new deviceEvents.DeviceCreatedEvent(id, id), 0)
        ])
        assertThat(device.changeVersion).is(UNINITIALISED_AGGREGATE_VERSION)
      })

      it('Load from Histoy', () => {
        const device = new DeviceAggregateRoot()
        const id = Uuid.createV4()
        const history = [{ event: new deviceEvents.DeviceCreatedEvent(id, id), version: 0 }]
        device.loadFromHistory(history)
        assertThat(device.id).is(id)
        assertThat(device.changeVersion).is(0)
      })
    })

    describe('Child Entities', () => {
      it('Create Child Entity', () => {
        const deviceId = Uuid.createV4()
        const alarmId = Uuid.createV4()
        const device = new DeviceAggregateRoot(deviceId) //+1 Event
        const alarm = device.addAlarm(alarmId) //+1 Event
        alarm.armAlarm(20) //+1 Event

        const events = device.uncommittedChanges()
        device.markChangesAsCommitted(events.length - 1)

        assertThat(events).is(match.array.length(3))
        assertThat(events).is([
          makeEntityEventMatcher(new deviceEvents.DeviceCreatedEvent(deviceId, deviceId), 0),
          makeEntityEventMatcher(new deviceEvents.AlarmCreatedEvent(deviceId, alarmId), 1),
          makeEntityEventMatcher(new deviceEvents.AlarmArmedEvent(deviceId, alarmId, 20), 2),
        ])

        const hydratedDevice = new DeviceAggregateRoot()
        hydratedDevice.loadFromHistory(events)
        assertThat(hydratedDevice).is(makeEntityMatcher(device))

        hydratedDevice.telemetryReceived(21)
        const uncomitted = hydratedDevice.uncommittedChanges()
        assertThat(uncomitted).is([makeEntityEventMatcher(new AlarmTriggeredEvent(hydratedDevice.id, alarm.id), 3)])
      })
    })
  })

  describe('GenericAggregateRoot', ()=>{
    describe('Event Sourceing Basics', () => {
      it('Uninitilaised', () => {
        const aggregate = new GenericAggregateRoot<DeviceEntity>((parent) => new DeviceEntity(parent))
        assertThat(aggregate.uncommittedChanges()).is([])
        assertThat(aggregate.changeVersion).is(UNINITIALISED_AGGREGATE_VERSION)
      })

      it('Create New Device', () => {
        const id = Uuid.createV4()
        const aggregate = new GenericAggregateRoot<DeviceEntity>((parent, id) => new DeviceEntity(parent, id), id)
        const events = aggregate.uncommittedChanges()
        assertThat(events).is([
          makeEntityEventMatcher(new deviceEvents.DeviceCreatedEvent(id, id), 0)
        ])
        assertThat(aggregate.changeVersion).is(UNINITIALISED_AGGREGATE_VERSION)
      })

      it('Load from Histoy', () => {
        const aggregate = new GenericAggregateRoot<DeviceEntity>((parent, id) => new DeviceEntity(parent, id))
        
        const id = Uuid.createV4()
        const history = [{ event: new deviceEvents.DeviceCreatedEvent(id, id), version: 0 }]
        aggregate.loadFromHistory(history)
        assertThat(aggregate.id).is(id)
        assertThat(aggregate.changeVersion).is(0)

        assertThat(aggregate.rootEntity.id).is(aggregate.id)
      })
    })

    describe('Child Entities', () => {
      it('Create Child Entity', () => {
        const deviceId = Uuid.createV4()
        const alarmId = Uuid.createV4()
        const aggregate = new GenericAggregateRoot<DeviceEntity>((parent, id) => new DeviceEntity(parent, id), deviceId) //+1
        // const device = new DeviceAggregateRoot(deviceId) //+1 Event
        const device = aggregate.rootEntity
        const alarm = device.addAlarm(alarmId) //+1 Event
        alarm.armAlarm(20) //+1 Event

        const events = aggregate.uncommittedChanges()
        aggregate.markChangesAsCommitted(events.length - 1)

        assertThat(events).is(match.array.length(3))
        assertThat(events).is([
          makeEntityEventMatcher(new deviceEvents.DeviceCreatedEvent(deviceId, deviceId), 0),
          makeEntityEventMatcher(new deviceEvents.AlarmCreatedEvent(deviceId, alarmId), 1),
          makeEntityEventMatcher(new deviceEvents.AlarmArmedEvent(deviceId, alarmId, 20), 2),
        ])

        // const hydratedDevice = new DeviceAggregateRoot()
        const hydratedAggregate = new GenericAggregateRoot<DeviceEntity>((parent) => new DeviceEntity(parent)) //+1
        hydratedAggregate.loadFromHistory(events)
        assertThat(hydratedAggregate).is(makeEntityMatcher(device))

        hydratedAggregate.rootEntity.telemetryReceived(21)
        const uncomitted = hydratedAggregate.uncommittedChanges()
        assertThat(uncomitted).is([makeEntityEventMatcher(new AlarmTriggeredEvent(hydratedAggregate.id, alarm.id), 3)])
      })
    })
  })

  const makeEventMatcher = <T extends IChangeEvent>(event: T): IChangeEvent => {
    return { ...event, id: match.any() }
  }
  const makeEntityEventMatcher = <T extends IChangeEvent>(event: T, version: number = UNINITIALISED_AGGREGATE_VERSION): IEntityEvent => {
    return { event: makeEventMatcher(event), version }
  }

  const makeEntityMatcher = (entity: IEntityAggregate | IAggregateRoot) => match.obj.has({ id: entity.id })
})