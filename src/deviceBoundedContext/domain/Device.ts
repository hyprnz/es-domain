import { Alarm } from '..'
import * as Uuid from '../../eventSourcing/UUID'
import { AggregateError } from '../../eventSourcing/AggregateError'
import { EntityBase } from '../../eventSourcing/EntityBase'
import { ChangeEvent} from '../../eventSourcing/MessageTypes'
import { DeviceCreatedEvent, AlarmCreatedEvent, AlarmDestroyedEvent } from '../events/deviceEvents'
import {StaticEventHandler} from "../../eventSourcing/Entity";
import {ParentAggregate} from "../../eventSourcing/AggregateEntity";

export class Device extends EntityBase {
  private alarms: Map<Uuid.UUID, Alarm> = new Map<Uuid.UUID, Alarm>()
  constructor(parent: ParentAggregate, id?: Uuid.UUID) {  // id?: Uuid.UUID
    super(parent)

    if (id) {
      // This is a new object
      this.applyChange(new DeviceCreatedEvent(this.parentId, id))
    }
  }

  addAlarm(id: Uuid.UUID): Alarm {
    const alarm = this.alarms.get(id)
    if (alarm) return alarm
    this.applyChange(new AlarmCreatedEvent(this.parentId, id))
    return this.findAlarm(id)!
  }

  destroyAlarm(alarm: Alarm): void {
    const foundAlarm = this.alarms.get(alarm.id)
    if (!foundAlarm) return

    this.applyChange(new AlarmDestroyedEvent(this.parentId, alarm.id))
  }

  findAlarm(id: Uuid.UUID): Alarm | undefined {
    return this.alarms.get(id)
  }

  telemetryReceived(value: number): void {
    this.alarms.forEach(x => x.isAlarmTriggered(value))
  }

  toString() { return `DeviceEntity:${this.id}` }

  protected override makeEventHandler(evt: ChangeEvent): (() => void) | undefined {
    const handlers: Array<() => void> = []

    const handler = Device.eventHandlers[evt.eventType]
    if (handler) handlers.push(() => handler.forEach(x => x.call(this, this, evt)))

    const child = this.alarms.get(evt.entityId)
    if (child) handlers.push(() => child.applyChangeEvent(evt))

    return (handlers.length)
      ? () => { handlers.forEach(x => x()) }
      : undefined
  }

  private static readonly eventHandlers: Record<string, Array<StaticEventHandler<Device>>> = {
    [DeviceCreatedEvent.eventType]: [(device, evt) => device.id = evt.aggregateRootId],

    [AlarmCreatedEvent.eventType]: [(device, evt) => {
      const alarm = new Alarm(device.parent)
      alarm.applyChangeEvent(evt)
      device.alarms.set(alarm.id, alarm)
    }],

    [AlarmDestroyedEvent.eventType]: [(device, evt) => {
      const alarmToDelete = device.alarms.get(evt.entityId)
      if (!alarmToDelete) throw new AggregateError(device.toString(), `Alarm Not Found, Alarm of id:${evt.entityId} missing from Device`)

      device.alarms.delete(alarmToDelete.id)
      alarmToDelete.applyChangeEvent(evt)
    }]
  }

}