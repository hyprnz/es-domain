import { Aggregate } from './Aggregate'
import { SnapShotInfo, SnapshotStrategy } from './contracts/SnapshotStrategy'

export class SnapshotStrategyBuilder {
  static never(): SnapshotStrategy {
    return new NeverSnapshot()
  }

  static afterCountOfEvents(eventCount: number): SnapshotStrategy {
    return new SnapshotEveryCountEvents(eventCount)
  }
}

class SnapshotEveryCountEvents implements SnapshotStrategy {
  constructor(private interval: number) {
    if (interval < 1) throw new Error('Interval must be greater than 0')
  }

  shouldSnapshot(aggregate: Aggregate, info: SnapShotInfo): boolean {
    const threshold = this.interval + (info.previousSnapshotVersion || 0) - 1
    return aggregate.uncommittedChanges().some(x => x.version >= threshold)
  }
}

class NeverSnapshot implements SnapshotStrategy {
  shouldSnapshot(): boolean {
    return false
  }
}
