import { Alarm } from '..'
import * as Uuid from '../../eventSourcing/UUID'
import { AggregateError } from '../../eventSourcing/AggregateError'
import { EntityBase } from '../../eventSourcing/EntityBase'
import { ChangeEvent } from '../../eventSourcing/MessageTypes'
import { SnapshotEntity, StaticEventHandler } from '../../eventSourcing/Entity'
import { EntityChangedObserver } from '../../eventSourcing/Aggregate'
import { AlarmCreatedEvent } from '../events/internal/AlarmCreatedEvent'
import { AlarmDestroyedEvent } from '../events/internal/AlarmDestroyedEvent'
import { DeviceCreatedEvent } from '../events/internal/DeviceCreatedEvent'
import { DeviceSnapshotEvent } from '../events/internal/DeviceSnapshotEvent'
import {AlarmSnapshotEvent} from "../events/internal/AlarmSnapshotEvent";

export class Device extends EntityBase implements SnapshotEntity {
  private alarms: Map<Uuid.UUID, Alarm> = new Map<Uuid.UUID, Alarm>()

  constructor(observer: EntityChangedObserver) {
    super(observer)
  }

  snapshot(dateTimeOfEvent: string): void {
    this.applySnapshot(
      DeviceSnapshotEvent.make(Uuid.createV4, {
        deviceId: this.id,
        dateTimeOfEvent
      })
    )
    this.alarms.forEach(x => x.snapshot(dateTimeOfEvent))
  }

  addAlarm(id: Uuid.UUID): Alarm {
    const alarm = this.alarms.get(id)
    if (alarm) return alarm
    this.applyChangeEvent(AlarmCreatedEvent.make(Uuid.createV4, { deviceId: this.id, alarmId: id }))
    return this.findAlarm(id)!
  }

  destroyAlarm(alarm: Alarm): void {
    const foundAlarm = this.alarms.get(alarm.id)
    if (!foundAlarm) return

    this.applyChangeEvent(AlarmDestroyedEvent.make(Uuid.createV4, { deviceId: this.id, alarmId: alarm.id }))
  }

  findAlarm(id: Uuid.UUID): Alarm | undefined {
    return this.alarms.get(id)
  }

  telemetryReceived(value: number): void {
    this.alarms.forEach(x => x.maybeTrigger(value))
  }

  toString() {
    return `Device: ${this.id}`
  }

  protected override makeEventHandler(evt: ChangeEvent): (() => void) | undefined {
    const handlers: Array<() => void> = []

    const handler: Array<StaticEventHandler<Device>> = Device.eventHandlers[evt.eventType]
    if (handler) handlers.push(() => handler.forEach(x => x.call(this, this, evt)))

    const child = this.alarms.get(evt.entityId)
    if (child) handlers.push(() => child.handleChangeEvent(evt))

    return handlers.length
      ? () => {
          handlers.forEach(x => x())
        }
      : undefined
  }

  private static readonly eventHandlers: Record<string, Array<StaticEventHandler<Device>>> = {
    [DeviceCreatedEvent.eventType]: [(device, evt) => (device.id = evt.aggregateRootId)],
    [DeviceSnapshotEvent.eventType]: [(device, evt) => (device.id = evt.aggregateRootId)],
    [AlarmSnapshotEvent.eventType]: [
      (device, evt) => {
        const alarm = new Alarm(device.observer)
        alarm.handleChangeEvent(evt)
        device.alarms.set(alarm.id, alarm)
      }
    ],
    [AlarmCreatedEvent.eventType]: [
      (device, evt) => {
        const alarm = new Alarm(device.observer)
        alarm.handleChangeEvent(evt)
        device.alarms.set(alarm.id, alarm)
      }
    ],

    [AlarmDestroyedEvent.eventType]: [
      (device, evt) => {
        const alarmToDelete = device.alarms.get(evt.entityId)
        if (!alarmToDelete)
          throw new AggregateError(device.toString(), `Alarm Not Found, Alarm of id:${evt.entityId} missing from Device`)

        device.alarms.delete(alarmToDelete.id)
        alarmToDelete.handleChangeEvent(evt)
      }
    ]
  }
}
