import { AggregateRoot } from "../EventSourcing/AggregateRoot"
import { AlarmCreatedEvent, DeviceCreatedEvent } from "./events/deviceEvents"
import * as Uuid from '../EventSourcing/UUID'
import { Alarm } from "./Alarm"
import { StaticEventHandler } from "../EventSourcing/Aggregate"
import { IChangeEvent } from "../EventSourcing/EventSourcingTypes"

export class Device extends AggregateRoot {
  private alarms: Array<Alarm> = []
  constructor(id?: Uuid.UUID) {
    super()

    // this.registerHandler(DeviceCreatedEvent.eventType, evt => this.id = evt.aggregateRootId)
    // this.registerHandler(AlarmCreatedEvent.eventType, evt => {
    //   AlarmCreatedEvent.assertIsAlarmCreatedEvent(evt)
    //   const alarm = new Alarm(this.thisAsParent, evt.alarmId)
    //   this.alarms.push(alarm)
    // })

    if (id) {
      // This is a new object
      this.applyChange(new DeviceCreatedEvent(id, id))
    }    
  }

  addAlarm(id: Uuid.UUID): Alarm {
    const alarm = this.alarms.find(x =>x.id === id)
    if(alarm) return alarm
    return new Alarm(this.thisAsParent, id)    
  }

  toString() {return  "DeviceAggregateRoot"}

  
  protected override makeEventHandler(evt: IChangeEvent) : () => void | undefined{
    const handler = Device.eventHandlers[evt.eventType]    
    if(handler) return () => handler.forEach(x => x.call(this, this, evt))

    const child = this.alarms.find(x =>x.id === evt.entityId)
    if(child) return () => child.applyChangeEvent(evt)
    
    return undefined    
  }
  
  static readonly eventHandlers: Record<string, Array<StaticEventHandler<Device>>> = {
    [DeviceCreatedEvent.eventType]: [(device, evt) => device.id = evt.aggregateRootId],
    [AlarmCreatedEvent.eventType]: [(device, evt) => {
      const alarm = new Alarm(device.thisAsParent)
      alarm.applyChangeEvent(evt)
      device.alarms.push(alarm)
    }]
  }
}