import { AggregateRoot } from "../EventSourcing/AggregateRoot"
import { AlarmCreatedEvent, AlarmDestroyedEvent, DeviceCreatedEvent } from "./events/deviceEvents"
import * as Uuid from '../EventSourcing/UUID'
import { Alarm } from "./Alarm"
import { ChangeEvent, StaticEventHandler } from "../EventSourcing/EventSourcingTypes"
import { AggregateError } from "../EventSourcing/AggregateError"

export class DeviceAggregateRoot extends AggregateRoot {
  private alarms: Array<Alarm> = []
  constructor(id?: Uuid.UUID) {
    super()
    if (id) {
      // This is a new object
      this.applyChange(new DeviceCreatedEvent(id, id))
    }    
  }

  addAlarm(id: Uuid.UUID): Alarm {
    const alarm = this.alarms.find(x =>x.id === id)
    if(alarm) return alarm
   
    this.applyChange(new AlarmCreatedEvent(this.id, id))
    return this.findAlarm(id)!
  }

  findAlarm(id: Uuid.UUID): Alarm | undefined {
    return this.alarms.find(x =>x.id === id)
  }

  destroyAlarm(alarm: Alarm): void {
    const foundAlarm = this.alarms.find(x =>x.id === alarm.id)
    if(!foundAlarm) return    
    
    this.applyChange(new AlarmDestroyedEvent(this.id, alarm.id))
  }

  // AggregateRoot performs aggregated actions on its children
  telemetryReceived(value: number): void{
    this.alarms.forEach(x => x.isAlarmTriggered(value))
  }

  toString() {return  "DeviceAggregateRoot"}

  
  protected override makeEventHandler(evt: ChangeEvent) : (() => void) | undefined {
    const handlers: Array<()=>void> = []

    const handler = DeviceAggregateRoot.eventHandlers[evt.eventType]    
    if(handler) handlers.push(() => handler.forEach(x => x.call(this, this, evt)))

    const child = this.alarms.find(x =>x.id === evt.entityId)
    if(child) handlers.push( () => child.applyChangeEvent(evt) )

    return (handlers.length) 
    ?  () => {handlers.forEach(x => x())}
    : undefined
  }
  
  private static readonly eventHandlers: Record<string, Array<StaticEventHandler<DeviceAggregateRoot>>> = {
    [DeviceCreatedEvent.eventType]: [(device, evt) => device.id = evt.aggregateRootId],
    [AlarmCreatedEvent.eventType]: [(device, evt) => {
      const alarm = new Alarm(device.thisAsParent)
      alarm.applyChangeEvent(evt)
      device.alarms.push(alarm)
    }],
    
    [AlarmDestroyedEvent.eventType]: [(device, evt) => {
      const alarmIndex = device.alarms.findIndex(x =>x.id === evt.entityId)
      if(alarmIndex === -1) throw new AggregateError(device.toString(),  `Alarm Not Found, Alarm of id:${evt.entityId} missing from Device`)
      const deletedAlarm = device.alarms.splice(alarmIndex, 1)[0]
      deletedAlarm.applyChangeEvent(evt)
    }]
  }
}