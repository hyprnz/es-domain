import * as Uuid from './UUID'

export interface IChangeEvent
{
    readonly id: Uuid.UUID
    readonly eventType: string
    readonly aggregateRootId : Uuid.UUID
}

export interface IEntityEvent
{
    version: number
    readonly event: IChangeEvent
}

export interface IAggregateRoot{
  readonly id: Uuid.UUID
  readonly changeVersion: number
  

  loadFromHistory(events: Array<IEntityEvent>): void
  uncommittedChanges(): Array<IEntityEvent>
  markChangesAsCommitted(version: number): void
}

export interface IAggregate {
  readonly id: Uuid.UUID
  applyChangeEvent(event: IEntityEvent): void
}


export interface IParentAggregateRoot {
  id() : Uuid.UUID,
  addChangeEvent(event: IChangeEvent): void
}