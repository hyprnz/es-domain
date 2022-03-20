import { WriteModelRepository } from '../../writeModelRepository/WriteModelRepository'
import * as Uuid from '../../eventSourcing/UUID'
import { DeviceAggregate } from '../domain/DeviceAggregate'
import { SnapshotWriteModelRepository } from '../../writeModelRepository/SnapshotWriteModelRepository'

export class DeviceRepository {
  constructor(private repository: WriteModelRepository, private snapshotRepository: SnapshotWriteModelRepository) {}

  async create(deviceId: Uuid.UUID): Promise<void> {
    await this.repository.save(new DeviceAggregate().withDevice(deviceId))
  }

  async save(aggregate: DeviceAggregate, countOfEvents = 1000): Promise<void> {
    await this.repository.save(aggregate)
    // This example uses snapshots for load optimisation. For many systems this won't be required
    // in which case we can simply ignore the following lines:
    if (aggregate.countOfEvents() > countOfEvents) {
      // During the repository save above uncommitted changes are marked as committed. We can now apply the
      // snapshot events which will be committed during save snapshot call.
      await this.snapshotRepository.saveSnapshot(aggregate)
    }
  }

  async load(id: Uuid.UUID): Promise<DeviceAggregate> {
    // This example uses snapshots for load optimisation. For many systems this won't be required
    // in which case we can simply load using:
    // return await this.repository.load(id, new DeviceAggregate())
    const snapshot = await this.snapshotRepository.loadSnapshot(id, new DeviceAggregate())
    if (snapshot.countOfEvents() === 0) {
      return this.repository.load(id, new DeviceAggregate())
    }
    return await this.repository.loadFromDate(id, snapshot, snapshot.changeVersion, snapshot.latestDateTimeFromEvents())
  }
}
