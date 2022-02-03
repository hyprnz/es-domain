import * as Uuid from '../EventSourcing/UUID'
import { Device } from "./Device"
import { assertThat, match } from "mismatched";
import * as deviceEvents from './events/deviceEvents'
import { IEntityAggregate, IChangeEvent, IEntityEvent, UNINITIALISED_AGGREGATE_VERSION, IAggregateRoot } from '../EventSourcing/EventSourcingTypes';
import { AlarmTriggeredEvent } from './events/deviceEvents';

describe('Device', () => {

  describe('Event Sourceing Basics', () => {
    it('Uninitilaised', () => {
      const device = new Device()
      assertThat(device.uncommittedChanges()).is([])
      assertThat(device.changeVersion).is(UNINITIALISED_AGGREGATE_VERSION)
    })

    it('Create New Device', () => {
      const id = Uuid.createV4()
      const device = new Device(id)
      const events = device.uncommittedChanges()
      assertThat(events).is([
        makeEntityEventMatcher(new deviceEvents.DeviceCreatedEvent(id, id), 0)
      ])
      assertThat(device.changeVersion).is(UNINITIALISED_AGGREGATE_VERSION)
    })

    it('Load from Histoy', () => {
      const device = new Device()
      const id = Uuid.createV4()
      const history = [{ event: new deviceEvents.DeviceCreatedEvent(id, id), version: 0 }]
      device.loadFromHistory(history)
      assertThat(device.id).is(id)
      assertThat(device.changeVersion).is(0)
    })
  })

  describe('Child Entities', ()=>{
    it('Create Child Entity', ()=>{
      const deviceId = Uuid.createV4()  
      const alarmId = Uuid.createV4()
      const device = new Device(deviceId) //+1 Event
      const alarm = device.addAlarm(alarmId) //+1 Event
      alarm.armAlarm(20) //+1 Event

      const events = device.uncommittedChanges()
      device.markChangesAsCommitted(events.length-1)

      assertThat(events).is(match.array.length(3))
      assertThat(events).is([
        makeEntityEventMatcher(new deviceEvents.DeviceCreatedEvent(deviceId, deviceId), 0),
        makeEntityEventMatcher(new deviceEvents.AlarmCreatedEvent(deviceId, alarmId), 1),
        makeEntityEventMatcher(new deviceEvents.AlarmArmedEvent(deviceId, alarmId, 20), 2),
      ])

      const hydratedDevice = new Device()
      hydratedDevice.loadFromHistory(events)
      assertThat(hydratedDevice).is(makeEntityMatcher(device))   
            
      hydratedDevice.telemetryReceived(21)
      const uncomitted = hydratedDevice.uncommittedChanges()
      assertThat(uncomitted).is([makeEntityEventMatcher(new AlarmTriggeredEvent(hydratedDevice.id, alarm.id), 3)])
    })
  })

  const makeEventMatcher = <T extends IChangeEvent>(event: T): IChangeEvent => {
    return { ...event, id: match.any() }
  }
  const makeEntityEventMatcher = <T extends IChangeEvent>(event: T, version: number = UNINITIALISED_AGGREGATE_VERSION): IEntityEvent => {
    return { event: makeEventMatcher(event), version }
  }

  const makeEntityMatcher = (entity: IEntityAggregate | IAggregateRoot ) => match.obj.has({id: entity.id})
})