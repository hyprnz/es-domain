import { Alarm, Device } from '..'
import * as Uuid from '../../eventSourcing/UUID'
import { AggregateContainer } from '../../eventSourcing/AggregateContainer'
import { ChangeEvent } from '../../eventSourcing/MessageTypes'
import { DeviceCreatedEvent } from '../events/internal/DeviceCreatedEvent'

export class DeviceAggregateInherited extends AggregateContainer<Device> {
  constructor() {
    super(() => new Device(evt => this.observe(evt)))
  }

  snapshot(): ChangeEvent[] {
    return this.rootEntity.snapshot(this.latestDateTimeFromEvents())
  }

  withDevice(id: Uuid.UUID): this {
    this.rootEntity.applyChangeEvent(DeviceCreatedEvent.make(Uuid.createV4, { deviceId: id }))
    return this
  }

  addAlarm(alarmId: Uuid.UUID): Alarm {
    return this.rootEntity.addAlarm(alarmId)
  }

  destroyAlarm(alarmId: Uuid.UUID): void {
    const alarm = this.rootEntity.findAlarm(alarmId)
    if (alarm) this.rootEntity.destroyAlarm(alarm)
  }

  maybeTriggerAlarm(alarmId: Uuid.UUID): boolean {
    const alarm = this.rootEntity.findAlarm(alarmId)
    if (!alarm) {
      return false
    }
    return alarm.maybeTrigger(10)
  }

  findAlarm(alarmId: Uuid.UUID): Alarm | undefined {
    return this.rootEntity.findAlarm(alarmId)
  }

  telemetryReceived(value: number): void {
    return this.rootEntity.telemetryReceived(value)
  }
}
