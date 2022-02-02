import { AggregateRoot } from "../EventSourcing/AggregateRoot"
import { AlarmCreatedEvent, assertIsAlarmCreatedEvent, DeviceCreatedEvent } from "./events/deviceEvents"
import * as Uuid from '../EventSourcing/UUID'
import { Alarm } from "./Alarm"


export class Device extends AggregateRoot {
  private alarms: Array<Alarm> = []
  constructor(id?: Uuid.UUID) {
    super()

    this.registerHandler(DeviceCreatedEvent.eventType, evt => super.id = evt.aggregateRootId)
    this.registerHandler(AlarmCreatedEvent.eventType, evt => {
      assertIsAlarmCreatedEvent(evt)
      const alarm = new Alarm(super.thisAsParent, evt.alarmId)
      this.alarms.push(alarm)
    })

    if (id) {
      // This is a new object
      this.applyChange(new DeviceCreatedEvent(id))
    }
  }
}