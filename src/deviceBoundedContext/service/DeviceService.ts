import * as Uuid from '../../eventSourcing/UUID'
import { DeviceRepository } from './DeviceRepository'

export class DeviceService {
  constructor(private repository: DeviceRepository) {}

  async addNewDeviceToNetwork(deviceId: Uuid.UUID): Promise<void> {
    await this.repository.create(deviceId)
  }

  async addDeviceAlarm(deviceId: Uuid.UUID, alarmId: Uuid.UUID): Promise<void> {
    const aggregate = await this.repository.load(deviceId)
    aggregate.addAlarm(alarmId)
    await this.repository.save(aggregate)
  }

  async removeDeviceAlarm(deviceId: Uuid.UUID, alarmId: Uuid.UUID): Promise<void> {
    const aggregate = await this.repository.load(deviceId)
    aggregate.destroyAlarm(alarmId)
    await this.repository.save(aggregate)
  }

  async triggerAlarm(deviceId: Uuid.UUID, alarmId: Uuid.UUID) {
    const aggregate = await this.repository.load(deviceId)
    aggregate.maybeTriggerAlarm(alarmId)
    await this.repository.save(aggregate)
  }
}
