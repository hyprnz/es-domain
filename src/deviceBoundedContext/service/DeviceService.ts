import * as Uuid from "../../eventSourcing/UUID";
import {DeviceRepository} from "./DeviceRepository";

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
        alarm?.maybeTrigger(10)
    }
}