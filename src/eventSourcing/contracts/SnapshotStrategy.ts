import { Aggregate } from '../Aggregate'
export interface SnapShotInfo {
  /** Current timestamp*/
  clock: number

  /** Version of last snapshot, consider storing this information on the aggregate container */
  previousSnapshotVersion?: number
  previousSnapshotDate?: number
}

export interface SnapshotStrategy {
  shouldSnapshot(aggregate: Aggregate, info: SnapShotInfo): boolean
}
