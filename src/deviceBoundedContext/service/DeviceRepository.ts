import * as Uuid from '../../eventSourcing/UUID'
import { DeviceAggregate } from '../domain/DeviceAggregate'
import { AggregateSnapshotRepository } from '../../writeModelRepository/AggregateSnapshotRepository'

export class DeviceRepository {
  constructor(private repository: AggregateSnapshotRepository) {}

  async create(deviceId: Uuid.UUID): Promise<void> {
    const aggregate = new DeviceAggregate()    
    await this.repository.save(new DeviceAggregate().withDevice(deviceId))
  }

  async save(aggregate: DeviceAggregate, countOfEvents = 1000): Promise<void> {
    await this.repository.save(aggregate, countOfEvents)
  }

  async load(id: Uuid.UUID): Promise<DeviceAggregate> {
    return await this.repository.load(id, () => new DeviceAggregate())
  }
}
