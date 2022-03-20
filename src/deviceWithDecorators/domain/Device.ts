import {Alarm} from './Alarm'
import * as Uuid from '../../eventSourcing/UUID'
import { Emits } from '../../eventSourcing/decorators'
import { AlarmCreated, AlarmCreatedPayload } from '../events/internal/AlarmCreatedEvent'
import { AlarmDestroyedEvent } from '../events/internal/AlarmDestroyedEvent'

export class Device {
    private alarms: Map<Uuid.UUID, Alarm> = new Map<Uuid.UUID, Alarm>()
    constructor(readonly id: Uuid.UUID) {}

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


    @Emits(AlarmCreated)
    private createAlarm(data: AlarmCreatedPayload) {
        const alarm = new Alarm(data.alarmId)
        this.alarms.set(alarm.id, alarm)
    }

    @Emits(AlarmDestroyedEvent.make)
    private removeAlarm(payload: AlarmDestroyedPayload) {
        this.alarms.delete(payload.alarmId)
    }
}