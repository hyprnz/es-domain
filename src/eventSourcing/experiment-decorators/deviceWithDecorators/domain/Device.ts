import {Alarm} from './Alarm'
import * as Uuid from '../../../UUID'
import { Emits, Entity } from '../../decorators'
import { AlarmCreatedEvent, AlarmCreatedPayload } from '../events/internal/AlarmCreatedEvent'
import { AlarmDestroyedEvent, AlarmDestroyedPayload } from '../events/internal/AlarmDestroyedEvent'
import { Parent } from '../../Aggregate'

@Entity
export class Device {
    private alarms: Map<Uuid.UUID, Alarm> = new Map<Uuid.UUID, Alarm>()
    constructor(readonly id: Uuid.UUID, readonly aggregate: Parent) {}

    addAlarm(id: Uuid.UUID): Alarm {
        const alarm = this.alarms.get(id)
        if (alarm) return alarm
        this.createAlarm({ alarmId: id })
        return this.findAlarm(id)!
    }

    destroyAlarm(alarm: Alarm): void {
        const foundAlarm = this.alarms.get(alarm.id)
        if (!foundAlarm) return
        this.removeAlarm({ alarmId: alarm.id })
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

    @Emits(AlarmCreatedEvent)
    private createAlarm(data: AlarmCreatedPayload) {
        const alarm = new Alarm(data.alarmId, this.aggregate)
        this.alarms.set(alarm.id, alarm)
    }

    @Emits(AlarmDestroyedEvent)
    private removeAlarm(payload: AlarmDestroyedPayload) {
        this.alarms.delete(payload.alarmId)
    }
}