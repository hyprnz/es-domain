import {WriteModelRepository} from "./WriteModelRepository";
import {WriteModelSnapshotRepository} from "./WriteModelSnapshotRepository";
import {Aggregate, SnapshotAggregate} from "../eventSourcing/Aggregate";
import { Uuid } from "..";

/** The domain repository should be used for aggregates that need snapshot management or generally for any aggregate */
export class DomainRepository {
  constructor(private repository: WriteModelRepository, private snapshotRepository: WriteModelSnapshotRepository) {}

  async create<T extends Aggregate>(aggregate: T): Promise<void> {
    await this.repository.save(aggregate)
  }

  async save<T extends SnapshotAggregate>(aggregate: T, countOfEvents = 1000): Promise<void> {
    await this.repository.save(aggregate)
    if (aggregate.countOfEvents() > countOfEvents) {
      await this.snapshotRepository.saveSnapshot(aggregate)
    }
  }

  async load<T extends SnapshotAggregate>(id: Uuid.UUID, activator:()=>T): Promise<T> {
    const snapshot = await this.snapshotRepository.loadSnapshot(id, activator())
    if (snapshot.countOfEvents() === 0) {
      return this.repository.load(id, activator())
    }
    return await this.repository.loadFromDate(id, snapshot, snapshot.changeVersion, snapshot.latestDateTimeFromEvents())
  }
}
