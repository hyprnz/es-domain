import * as Uuid from '../EventSourcing/UUID'
import { Entity, StaticEventHandler } from "../EventSourcing/Entity";
import { AlarmCreatedEvent, DeviceCreatedEvent } from "./events/deviceEvents"
import { IChangeEvent, IParentAggregateRoot } from "../EventSourcing/EventSourcingTypes";
import { Alarm } from '.';

export class DeviceEntity extends Entity {
  private alarms: Array<Alarm> = []
  constructor(parent: IParentAggregateRoot, id?: Uuid.UUID) {
    super(parent)

    if(id){
      // This is a new object
      this.applyChange(new DeviceCreatedEvent(this.parentId, id))
    }
  }

  addAlarm(id: Uuid.UUID): Alarm {
    const alarm = this.alarms.find(x =>x.id === id)
    if(alarm) return alarm
    return new Alarm(this.parent, id)    
  }

  // AggregateRoot performs aggregated actions on its children
  telemetryReceived(value: number): void{
    this.alarms.forEach(x => x.isAlarmTriggered(value))
  }

  toString() {return  `DeviceEntity:${this.id}`}

  protected override makeEventHandler(evt: IChangeEvent) : (() => void) | undefined {
    const handler = DeviceEntity.eventHandlers[evt.eventType]    
    if(handler) return () => handler.forEach(x => x.call(this, this, evt))

    const child = this.alarms.find(x =>x.id === evt.entityId)
    if(child) return () => child.applyChangeEvent(evt)

    return undefined
  }

  private static readonly eventHandlers: Record<string, Array<StaticEventHandler<DeviceEntity>>> = {
    [DeviceCreatedEvent.eventType]: [(device, evt) => device.id = evt.aggregateRootId],
    [AlarmCreatedEvent.eventType]: [(device, evt) => {
      const alarm = new Alarm(device.parent)
      alarm.applyChangeEvent(evt)
      device.alarms.push(alarm)
    }]
  }

}