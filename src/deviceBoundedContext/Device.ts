import { AggregateRoot } from "../EventSourcing/AggregateRoot"
import { AlarmCreatedEvent, DeviceCreatedEvent } from "./events/deviceEvents"
import * as Uuid from '../EventSourcing/UUID'
import { Alarm } from "./Alarm"


export class Device extends AggregateRoot {
  private alarms: Array<Alarm> = []
  constructor(id?: Uuid.UUID) {
    super()

    this.registerHandler(DeviceCreatedEvent.eventType, evt => super.id = evt.aggregateRootId)
    this.registerHandler(AlarmCreatedEvent.eventType, evt => {
      AlarmCreatedEvent.assertIsAlarmCreatedEvent(evt)
      const alarm = new Alarm(super.thisAsParent, evt.alarmId)
      this.alarms.push(alarm)
    })

    if (id) {
      // This is a new object
      this.applyChange(new DeviceCreatedEvent(id))
    }    
  }

  addAlarm(id: Uuid.UUID): Alarm {
    const alarm = new Alarm(super.thisAsParent, id)
    return alarm
  }
}