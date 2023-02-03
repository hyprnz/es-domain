import { Alarm, Device } from '..'
import * as Uuid from '../../util/UUID'
import { AggregateContainer } from '../../eventSourcing/AggregateContainer'
import { ChangeEvent } from '../../eventSourcing/contracts/MessageTypes'
import { DeviceCreatedEvent } from '../events/internal/DeviceCreatedEvent'
import { DeviceCreationParmaters } from './Device'

/** @deprecated
 * This is an example of an Aggregate Root that uses inheratance so that all the Aggregate Containers properties appepar on the aggregate root
 * Use Non inherited version
 * */
class DeviceAggregateInherited extends AggregateContainer<Device, DeviceCreationParmaters> {
  constructor(id: Uuid.UUID,) {
    super(Device)
  }

  snapshot(): ChangeEvent[] {
    return this.rootEntity.snapshot(this.latestDateTimeFromEvents())
  }

  withDevice(id: Uuid.UUID, colour: string): this {
    this.rootEntity.applyChangeEvent(DeviceCreatedEvent.make(Uuid.createV4, { deviceId: id, colour }))
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
