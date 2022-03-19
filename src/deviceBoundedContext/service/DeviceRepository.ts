import { WriteModelRepository } from '../../writeModelRepository/WriteModelRepository'
import * as Uuid from '../../eventSourcing/UUID'
import { DeviceAggregate } from '../domain/DeviceAggregate'

export class DeviceRepository {
  constructor(private repository: WriteModelRepository) {}

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
