import * as Uuid from '../../eventSourcing/UUID'
import { Emits } from '../../eventSourcing/decorators';
import { alarmArmedEvent, AlarmArmedPayload, alarmDisarmedEvent, alarmTriggeredEvent } from '../events/internal/DeviceEvents';

export class Alarm {
    private isArmed: boolean = false
    private threshold: number = 0;
    private isTriggered: boolean = false;

    constructor(readonly id: Uuid.UUID) {}

    armAlarm(alarmThreshold: number): void {
        if (alarmThreshold < 0 || alarmThreshold > 100) {
            throw new Error("Alarm threshold Failed Validation")
        }
        if (!this.isArmed) {
            this.arm({ threshold: alarmThreshold })
        }
    }

    disarmAlarm(): void {
        if (this.isArmed) {
          this.disarm()
        }
    }

    maybeTrigger(value: number): boolean {
        if (value < this.threshold) return false

        if (this.isArmed && !this.isTriggered) {
          this.trigger()
        }
        return true
    }

    toString() {
        return `Alarm: ${this.id}`
    }

    @Emits(alarmArmedEvent)
    private arm (payload: AlarmArmedPayload): void {
        this.isArmed = true
        this.threshold = payload.threshold
    }

    @Emits(alarmDisarmedEvent)
    private disarm(): void {
        this.isArmed = false
    }

    @Emits(alarmTriggeredEvent)
    private trigger(): void {
        this.isTriggered = true
    }
}
