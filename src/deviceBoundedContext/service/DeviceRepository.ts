import { WriteModelRepository } from '../../writeModelRepository/WriteModelRepository'
import * as Uuid from '../../eventSourcing/UUID'
import { DeviceAggregate } from '../domain/DeviceAggregate'
import { SnapshotWriteModelRepository } from '../../writeModelRepository/SnapshotWriteModelRepository'

export class DeviceRepository {
  constructor(private repository: WriteModelRepository, private snapshotRepository: SnapshotWriteModelRepository) {}

  async create(deviceId: Uuid.UUID): Promise<void> {
    await this.repository.save(new DeviceAggregate().withDevice(deviceId))
  }

  async save(aggregate: DeviceAggregate): Promise<void> {
    await this.repository.save(aggregate)
    // This example uses snapshots for load optimisation. For many systems this won't be required
    // in which case we can simply ignore the following lines:
    if (aggregate.countOfEvents() > 1000) {
      // During the repository save above uncommitted changes are marked as committed. We can now apply the
      // snapshot events which will be committed during save snapshot call.
      aggregate.snapshot()
      await this.snapshotRepository.saveSnapshot(aggregate)
    }
  }

  async load(id: Uuid.UUID): Promise<DeviceAggregate> {
    // This example uses snapshots for load optimisation. For many systems this won't be required
    // in which case we can simply load using:
    // return await this.repository.load(id, new DeviceAggregate().withDevice(id))
    const snapshot = await this.snapshotRepository.loadSnapshot(id, new DeviceAggregate().withDevice(id))
    return await this.repository.loadFromDate(id, snapshot, snapshot.latestDateTimeFromEvents())
  }
}
