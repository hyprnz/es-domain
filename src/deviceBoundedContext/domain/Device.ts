import { Alarm } from '..'
import * as Uuid from '../../util/UUID'
import { AggregateError } from '../../eventSourcing/AggregateError'
import { EntityBase } from '../../eventSourcing/EntityBase'
import { ChangeEvent } from '../../eventSourcing/MessageTypes'
import { EntityConstructorPayload, SnapshotEntity, StaticEventHandler } from '../../eventSourcing/Entity'
import { EntityChangedObserver } from '../../eventSourcing/Aggregate'
import { AlarmCreatedEvent } from '../events/internal/AlarmCreatedEvent'
import { AlarmDestroyedEvent } from '../events/internal/AlarmDestroyedEvent'
import { DeviceCreatedEvent } from '../events/internal/DeviceCreatedEvent'
import { DeviceSnapshotEvent } from '../events/internal/DeviceSnapshotEvent'
import { AlarmSnapshotEvent } from '../events/internal/AlarmSnapshotEvent'

export interface DeviceCreationParmaters  extends EntityConstructorPayload {
  colour: string
}

export class Device extends EntityBase implements SnapshotEntity {
  private colour: string
  private alarms: Map<Uuid.UUID, Alarm> = new Map<Uuid.UUID, Alarm>()

  constructor(observer: EntityChangedObserver, payload: DeviceCreationParmaters, isLoading: boolean = false) {
    super(observer)

    this.colour = payload.colour
    if (!isLoading) {
      this.applyChangeEvent(DeviceCreatedEvent.make(
        Uuid.createV4,
        {
          deviceId: payload.id,
          colour: payload.colour,
        }
      ))
    }
  }

  /** There are now 2 ways a device can be created, Snapshot or new device */
  static toCreationParameters(event: ChangeEvent): DeviceCreationParmaters {
    if(DeviceCreatedEvent.isDeviceCreatedEvent(event)){
      return { id: event.id, colour: event.colour }
    }

    DeviceSnapshotEvent.assertIsDeviceSnapshotEvent(event)
    return { id: event.id, colour: event.colour }
  }

  snapshot(dateTimeOfEvent: string): ChangeEvent[] {
    const alarmSnapshots = Array.from(this.alarms.values()).reduce(
      (accum: ChangeEvent[], a: Alarm) => [...accum, ...a.snapshot(dateTimeOfEvent)],
      []
    )
    return [
      DeviceSnapshotEvent.make(Uuid.createV4, {
        deviceId: this.id,
        dateTimeOfEvent,
        colour: this.colour,
      }),
      ...alarmSnapshots
    ]
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
    [DeviceCreatedEvent.eventType]: [
      (device, evt) => {
        DeviceCreatedEvent.assertIsDeviceCreatedEvent(evt)
        device.id = evt.aggregateRootId
        device.colour = evt.colour
      }
    ],
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
        if (!alarmToDelete) {
          throw new AggregateError(device.toString(), `Alarm Not Found, Alarm of id: ${evt.entityId} missing from Device`)
        }
        device.alarms.delete(alarmToDelete.id)
        alarmToDelete.handleChangeEvent(evt)
      }
    ]
  }
}
