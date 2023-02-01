import * as Uuid from '../../../../util/UUID'
import { Parent } from '../../Aggregate';
import { Emits, Entity } from '../../decorators';
import { AlarmArmedEvent, AlarmArmedPayload } from '../events/internal/AlarmArmedEvent';
import { AlarmDisarmedEvent } from '../events/internal/AlarmDisarmedEvent';
import { AlarmTriggeredEvent } from '../events/internal/AlarmTriggeredEvent';

@Entity
export class Alarm {
    private isArmed: boolean = false
    private threshold: number = 0;
    private isTriggered: boolean = false;

    constructor(readonly id: Uuid.UUID, readonly aggregate: Parent) {}

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

    @Emits(AlarmArmedEvent)
    private arm (payload: AlarmArmedPayload): void {
        this.isArmed = true
        this.threshold = payload.threshold
    }

    @Emits(AlarmDisarmedEvent)
    private disarm(): void {
        this.isArmed = false
    }

    @Emits(AlarmTriggeredEvent)
    private trigger(): void {
        this.isTriggered = true
    }
}
