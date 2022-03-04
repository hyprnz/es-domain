import { Device } from "..";
import { AggregateContainer } from "../../EventSourcing/AggregateRoot";
import * as Uuid from "../../EventSourcing/UUID";
import { WriteModelRepository } from "../../EventSourcing/WriteModelTypes";


export class DeviceService {
  constructor(private writeRepo: WriteModelRepository) { }

  private static deviceAggregateFactory = (deviceId: Uuid.UUID) => new AggregateContainer(Device, deviceId)

  async addNewDeviceToNetwork(deviceId: Uuid.UUID): Promise<void> {
    const aggregate = DeviceService.deviceAggregateFactory(deviceId)
    await this.writeRepo.save(aggregate)
  }

  async addDeviceAlarm(deviceId: Uuid.UUID, alarmId: Uuid.UUID): Promise<void> {

    const aggregate = await this.writeRepo.load(deviceId, DeviceService.deviceAggregateFactory)
    aggregate.rootEntity.addAlarm(alarmId)
    await this.writeRepo.save(aggregate)
  }

  async removeDeviceAlarm(deviceId: Uuid.UUID, alarmId: Uuid.UUID): Promise<void> {
    const aggregate = await this.writeRepo.load(deviceId, DeviceService.deviceAggregateFactory)

    const alarm = aggregate.rootEntity.findAlarm(alarmId)
    if (alarm) aggregate.rootEntity.destroyAlarm(alarm)
    await this.writeRepo.save(aggregate)
  }

}