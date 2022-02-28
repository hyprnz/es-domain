import { Alarm } from '..'
import { Emits } from '../../EventSourcing/decorators'
import { ParentAggregate, Entity } from '../../EventSourcing/EventSourcingTypes'
import { UUID } from '../../EventSourcing/UUID'
import { DeviceCreatedEvent, AlarmCreatedEvent, AlarmDestroyedEvent, DeviceDomainError } from '../events/deviceEvents'

export class Device implements Entity {
  private initialised = false;
  private alarms: Map<UUID, Alarm> = new Map<UUID, Alarm>()

  constructor(readonly aggregate: ParentAggregate, readonly id: UUID) {}

  @Emits(DeviceCreatedEvent)
  initialise() {
    this.initialised = true
  }

  addAlarm(id: UUID): Alarm {
    if (!this.initialised) throw new DeviceDomainError(this.aggregate.id(), "Device must be initialised before adding alarms")
    const alarm = this.findAlarm(id)
    if (alarm) return alarm

    this.addNewAlarm({ alarmId: id })
    return this.findAlarm(id)!
  }

  destroyAlarm(alarm: Alarm): void {
    const foundAlarm = this.findAlarm(alarm.id)
    if (!foundAlarm) return

    this.removeAlarm({ alarmId: alarm.id })
  }

  findAlarm(id: UUID): Alarm | undefined {
    return this.alarms.get(id)
  }

  telemetryReceived(value: number): void {
    this.alarms.forEach(x => x.isAlarmTriggered(value))
  }

  @Emits(AlarmCreatedEvent)
  private addNewAlarm(alarmData: { alarmId: UUID }) {
    const alarm = new Alarm(this.aggregate, alarmData.alarmId)
    this.alarms.set(alarm.id, alarm)
  }

  @Emits(AlarmDestroyedEvent)
  private removeAlarm(alarmData: { alarmId: UUID }) {
      this.alarms.delete(alarmData.alarmId)
  }

  toString() { return `DeviceEntity:${this.id}` }
}