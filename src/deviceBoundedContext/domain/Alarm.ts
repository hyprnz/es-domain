import * as Uuid from '../../eventSourcing/UUID'
import { EntityBase } from '../../eventSourcing/EntityBase'
import { ChangeEvent } from '../../eventSourcing/MessageTypes'
import { DeviceDomainError } from '../events/internal/DeviceDomainError'
import { SnapshotEntity, StaticEventHandler } from '../../eventSourcing/Entity'
import { EntityChangedObserver } from '../../eventSourcing/Aggregate'
import { AlarmCreatedEvent } from '../events/internal/AlarmCreatedEvent'
import { AlarmArmedEvent } from '../events/internal/AlarmArmedEvent'
import { AlarmDisarmedEvent } from '../events/internal/AlarmDisarmedEvent'
import { AlarmTriggeredEvent } from '../events/internal/AlarmTriggeredEvent'
import { AlarmDestroyedEvent } from '../events/internal/AlarmDestroyedEvent'
import { AlarmSnapshotEvent } from '../events/internal/AlarmSnapshotEvent'

export class Alarm extends EntityBase implements SnapshotEntity {
  private _deviceId: Uuid.UUID | undefined
  get deviceId(): Uuid.UUID {
    if (!this._deviceId) {
      throw new Error(`Alarm deviceId not initialised`)
    }
    return this._deviceId
  }

  set deviceId(value) {
    this._deviceId = value
  }

  private isArmed: boolean = false
  private threshold: number = 0
  private isTriggered: boolean = false

  constructor(observer: EntityChangedObserver) {
    super(observer)
  }

  snapshot(dateTimeOfEvent: string): void {
    this.applyChangeEvent(
      AlarmSnapshotEvent.make(Uuid.createV4, {
        deviceId: this.deviceId,
        alarmId: this.id,
        dateTimeOfEvent
      })
    )
  }

  armAlarm(alarmThreshold: number): void {
    if (alarmThreshold < 0 || alarmThreshold > 100) {
      throw new DeviceDomainError(this.deviceId, 'Alarm threshold Failed Validation')
    }
    if (!this.isArmed) {
      this.applyChangeEvent(
        AlarmArmedEvent.make(Uuid.createV4, {
          deviceId: this.deviceId,
          alarmId: this.id,
          threshold: alarmThreshold
        })
      )
    }
  }

  disarmAlarm(): void {
    if (this.isArmed) {
      this.applyChangeEvent(AlarmDisarmedEvent.make(Uuid.createV4, { deviceId: this.deviceId, alarmId: this.id }))
    }
  }

  maybeTrigger(value: number): boolean {
    if (value < this.threshold) return false

    if (this.isArmed && !this.isTriggered) {
      // Emit trigger event
      this.applyChangeEvent(AlarmTriggeredEvent.make(Uuid.createV4, { deviceId: this.deviceId, alarmId: this.id }))
    }

    return true
  }

  toString() {
    return `Alarm: ${this.id}`
  }

  protected override makeEventHandler(evt: ChangeEvent): (() => void) | undefined {
    const handlers: Array<() => void> = []

    const handler = Alarm.eventHandlers[evt.eventType]
    if (handler) handlers.push(() => handler.forEach(x => x.call(this, this, evt)))

    return handlers.length
      ? () => {
          handlers.forEach(x => x())
        }
      : undefined
  }

  static readonly eventHandlers: Record<string, Array<StaticEventHandler<Alarm>>> = {
    [AlarmCreatedEvent.eventType]: [
      (alarm, evt) => {
        alarm.id = evt.entityId
        alarm.deviceId = evt.aggregateRootId
      }
    ],
    [AlarmDisarmedEvent.eventType]: [alarm => (alarm.isArmed = false)],
    [AlarmArmedEvent.eventType]: [
      (alarm, evt) => {
        if (AlarmArmedEvent.isAlarmArmedEvent(evt)) {
          alarm.isArmed = true
          alarm.threshold = evt.threshold
        }
      }
    ],
    [AlarmTriggeredEvent.eventType]: [alarm => (alarm.isTriggered = true)],
    [AlarmDestroyedEvent.eventType]: [() => {}]
  }
}
