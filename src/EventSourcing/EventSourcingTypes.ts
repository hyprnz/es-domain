import * as Uuid from './UUID'

export interface IChangeEvent
{
    readonly eventType: string
    readonly aggregateId : Uuid.UUID
}

export interface IEntityEvent
{
    version: number
    readonly event: IChangeEvent
}

export interface IAggregateRoot{
  readonly id: Uuid.UUID
  readonly changeVersion: number
  

  loadFromHistory(events: Array<IEntityEvent>)
  uncommittedChanges(): Array<IEntityEvent>
  markChangesAsCommitted(version: number): void
}