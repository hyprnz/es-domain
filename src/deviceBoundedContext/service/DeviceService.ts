import {Device} from "..";
import {AggregateContainer} from "../../eventSourcing/AggregateContainer";
import * as Uuid from "../../eventSourcing/UUID";
import {WriteModelRepository} from "../../writeModelRepository/WriteModelRepository";


export class DeviceService {
    constructor(private writeRepo: WriteModelRepository) {
    }

    private static deviceAggregateFactory = (deviceId: Uuid.UUID) => new AggregateContainer(Device, deviceId)

    async addNewDeviceToNetwork(deviceId: Uuid.UUID): Promise<void> {
        const aggregate = DeviceService.deviceAggregateFactory(deviceId)
        await this.writeRepo.save(aggregate)
    }

    async addDeviceAlarm(deviceId: Uuid.UUID, alarmId: Uuid.UUID): Promise<void> {
        const aggregate = await this.writeRepo.load(deviceId, new AggregateContainer(Device))
        aggregate.rootEntity.addAlarm(alarmId)
        await this.writeRepo.save(aggregate)
    }

    async removeDeviceAlarm(deviceId: Uuid.UUID, alarmId: Uuid.UUID): Promise<void> {
        const aggregate = await this.writeRepo.load(deviceId, new AggregateContainer(Device))
        const alarm = aggregate.rootEntity.findAlarm(alarmId)
        if (alarm) aggregate.rootEntity.destroyAlarm(alarm)
        await this.writeRepo.save(aggregate)
    }

    async triggerAlarm(deviceId: Uuid.UUID, alarmId: Uuid.UUID) {
        // TODO: trigger alarms on device
        const aggregate = await this.writeRepo.load(deviceId, new AggregateContainer(Device))
        const alarm = aggregate.rootEntity.findAlarm(alarmId)
        alarm?.isAlarmTriggered(10)
    }
}