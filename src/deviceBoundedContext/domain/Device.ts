import { Alarm } from '..'
import { Emits } from '../../EventSourcing/decorators'
import { ParentAggregate, Entity } from '../../EventSourcing/EventSourcingTypes'
import { UUID } from '../../EventSourcing/UUID'
import { DeviceCreatedEvent, AlarmCreatedEvent, AlarmDestroyedEvent, CreateAlarmPayload } from '../events'
import { DeviceDomainError } from './DeviceDomainError'

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
  private addNewAlarm(data: CreateAlarmPayload) {
    const alarm = new Alarm(this.aggregate, data.alarmId)
    this.alarms.set(alarm.id, alarm)
  }

  @Emits(AlarmDestroyedEvent)
  private removeAlarm(data: { alarmId: UUID }) {
      this.alarms.delete(data.alarmId)
  }

  toString() { return `DeviceEntity:${this.id}` }
}