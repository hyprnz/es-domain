import {Alarm, Device} from '..'
import * as Uuid from '../../eventSourcing/UUID'
import {AggregateContainer} from "../../eventSourcing/AggregateContainer";
import {EntityEvent} from "../../eventSourcing/MessageTypes";
import {DeviceCreatedEvent} from "../events/internal/DeviceEvents";

export class DeviceAggregate extends AggregateContainer<Device> {

    withDevice(id: Uuid.UUID): this {
        this.rootEntity = new Device((evt) => this.observe(evt))
        this.rootEntity.applyChangeEvent(new DeviceCreatedEvent(id, id))
        return this
    }

    loadFromHistory(history: EntityEvent[]): void {
        this.rootEntity = new Device((evt) => this.observe(evt))
        super.loadFromHistory(history)
    }

    addAlarm(alarmId: Uuid.UUID): Alarm {
        return this.rootEntity.addAlarm(alarmId)
    }

    destroyAlarm(alarmId: Uuid.UUID): void {
        const alarm = this.rootEntity.findAlarm(alarmId)
        if (alarm) this.rootEntity.destroyAlarm(alarm)
    }

    maybeTriggerAlarm(alarmId: Uuid.UUID): void {
        const alarm = this.rootEntity.findAlarm(alarmId)
        alarm?.maybeTrigger(10)
    }

    findAlarm(alarmId: Uuid.UUID): Alarm | undefined {
        return this.rootEntity.findAlarm(alarmId)
    }

    telemetryReceived(value: number): void {
        return this.rootEntity.telemetryReceived(value)
    }
}