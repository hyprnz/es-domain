import * as Uuid from "../../eventSourcing/UUID";
import {WriteModelRepository} from "../../writeModelRepository/WriteModelRepository";
import {DeviceAggregate} from "../domain/DeviceAggregate";

export class DeviceRepository {
    constructor(private repository: WriteModelRepository) {
    }

    async create(deviceId: Uuid.UUID): Promise<void> {
        await this.repository.save(new DeviceAggregate().withDevice(deviceId))
    }

    async save(aggregate: DeviceAggregate): Promise<void> {
        await this.repository.save(aggregate)
    }

    async load(deviceId: Uuid.UUID): Promise<DeviceAggregate> {
        return await this.repository.load(deviceId, new DeviceAggregate())
    }
}

export class DeviceService {
    constructor(private repository: DeviceRepository) {
    }

    async addNewDeviceToNetwork(deviceId: Uuid.UUID): Promise<void> {
        await this.repository.create(deviceId)
    }

    async addDeviceAlarm(deviceId: Uuid.UUID, alarmId: Uuid.UUID): Promise<void> {
        const aggregate = await this.repository.load(deviceId)
        aggregate.rootEntity.addAlarm(alarmId)
        await this.repository.save(aggregate)
    }

    async removeDeviceAlarm(deviceId: Uuid.UUID, alarmId: Uuid.UUID): Promise<void> {
        const aggregate = await this.repository.load(deviceId)
        const alarm = aggregate.rootEntity.findAlarm(alarmId)
        if (alarm) aggregate.rootEntity.destroyAlarm(alarm)
        await this.repository.save(aggregate)
    }

    async triggerAlarm(deviceId: Uuid.UUID, alarmId: Uuid.UUID) {
        // TODO: trigger alarms on device
        const aggregate = await this.repository.load(deviceId)
        const alarm = aggregate.rootEntity.findAlarm(alarmId)
        alarm?.isAlarmTriggered(10)
    }
}