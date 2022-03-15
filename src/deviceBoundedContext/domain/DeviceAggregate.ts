import {Alarm, Device} from '..'
import * as Uuid from '../../eventSourcing/UUID'
import {UUID} from '../../eventSourcing/UUID'
import {AggregateContainer} from "../../eventSourcing/AggregateContainer";
import {EntityEvent} from "../../eventSourcing/MessageTypes";
import {DeviceCreatedEvent} from "../events/internal/DeviceEvents";
import {Aggregate} from "../../eventSourcing/Aggregate";

export class DeviceAggregate implements Aggregate {

    constructor(private aggregateContainer: AggregateContainer<Device> = new AggregateContainer<Device>()) {
    }

    private get root(): Device {
        return this.aggregateContainer.rootEntity
    }

    get changeVersion(): number {
        return this.aggregateContainer.changeVersion
    }

    get id(): UUID {
        return this.aggregateContainer.id
    }

    markChangesAsCommitted(version: number): void {
        this.aggregateContainer.markChangesAsCommitted(version)
    }

    uncommittedChanges(): Array<EntityEvent> {
        return this.aggregateContainer.uncommittedChanges()
    }

    withDevice(id: Uuid.UUID): this {
        this.aggregateContainer.rootEntity = new Device((evt) => this.aggregateContainer.observe(evt))
        this.root.applyChangeEvent(new DeviceCreatedEvent(id, id))

        return this
    }

    loadFromHistory(history: EntityEvent[]): void {
        this.aggregateContainer.rootEntity = new Device((evt) => this.aggregateContainer.observe(evt))
        this.aggregateContainer.loadFromHistory(history)
    }

    addAlarm(alarmId: Uuid.UUID): Alarm {
        return this.root.addAlarm(alarmId)
    }

    destroyAlarm(alarmId: Uuid.UUID): void {
        const alarm = this.root.findAlarm(alarmId)
        if (alarm) this.root.destroyAlarm(alarm)
    }

    maybeTriggerAlarm(alarmId: Uuid.UUID): boolean {
        const alarm = this.root.findAlarm(alarmId)
        if (!alarm) {
            return false
        }
        return alarm.maybeTrigger(10)
    }

    findAlarm(alarmId: Uuid.UUID): Alarm | undefined {
        return this.root.findAlarm(alarmId)
    }

    telemetryReceived(value: number): void {
        return this.root.telemetryReceived(value)
    }
}