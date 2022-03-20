import { WriteModelRepository } from './WriteModelRepository'
import { WriteModelSnapshotRepository } from './WriteModelSnapshotRepository'
import { Aggregate, SnapshotAggregate } from '../eventSourcing/Aggregate'
import { EntityEvent, Uuid } from '..'

/** This repository should be used for aggregates that need snapshot management or generally for any aggregate
 * which might have more than 1000 events for a single aggregate id. */
export class AggregateSnapshotRepository {
  constructor(private repository: WriteModelRepository, private snapshotRepository: WriteModelSnapshotRepository) {}

  async create<T extends Aggregate>(aggregate: T): Promise<void> {
    await this.repository.save(aggregate)
  }

  async save<T extends SnapshotAggregate>(aggregate: T, countOfEvents = 1000): Promise<number> {
    const count = await this.repository.save(aggregate)
    if (aggregate.countOfEvents() > countOfEvents) {
      await this.snapshotRepository.saveSnapshot(aggregate)
    }
    return count
  }

  async load<T extends SnapshotAggregate>(id: Uuid.UUID, activator: () => T): Promise<T> {
    const snapshot = await this.snapshotRepository.loadSnapshot(id, activator())
    if (snapshot.countOfEvents() === 0) {
      return this.repository.load(id, activator())
    }
    return await this.repository.loadAfterVersion(id, snapshot, snapshot.changeVersion)
  }

  subscribeToChangesSynchronously(handler: (changes: Array<EntityEvent>) => Promise<void>) {
    this.repository.subscribeToChangesSynchronously(handler)
  }
}
