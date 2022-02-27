import * as Uuid from './UUID'
import { AggregateError } from './AggregateError'
import { ChangeEvent, Delta, EntityEvent, ParentAggregate, UNINITIALISED_AGGREGATE_VERSION } from './EventSourcingTypes'
import { EntityBase } from './Entity'

export class Aggregate<T extends {id: Uuid.UUID} = {id: Uuid.UUID}> {
  id: Uuid.UUID
  public readonly rootEntity: T 

  private version: number
  private changes: Array<EntityEvent> = []
  protected thisAsParent: ParentAggregate 

  constructor(id:Uuid.UUID, makeRootEntity: (id:Uuid.UUID, aggregate: ParentAggregate)=>T){
    this.id = id
    this.version = UNINITIALISED_AGGREGATE_VERSION

    this.thisAsParent = {
      id: () => this.id,
      addChangeEvent: (evt) => this.changes.push({
        event:evt, 
        version: UNINITIALISED_AGGREGATE_VERSION
      })
    }

    this.rootEntity = makeRootEntity(id, this.thisAsParent)
  }

  get changeVersion() : number { return this.version }

  loadFromHistory(history: EntityEvent[]): void{
    history.forEach(evt => {
      const expectedVersion = this.version + 1
      if(expectedVersion !== evt.version){
        throw new AggregateError( typeof this,  'Failed to load unexpected event version') 
      }

      const handler = this.getEventHandler(evt.event.eventType)
      if(!handler) throw new AggregateError(typeof this,  'Failed to find handler for event type') 
      handler(evt.event.delta)

      this.version = evt.version
    })
  }

  uncommittedChanges(): EntityEvent[] {
    // Probably a better way of doing this, must preserve order
    const uncommited = [...this.changes]
    uncommited.forEach((e, index) => e.version = this.version + index + 1)
    return uncommited
  }

  markChangesAsCommitted(version: number): void {
    this.changes = []
    this.version = version
  }

  toString(){
    return `AggregateRoot:${this.id}, Version:${this.changeVersion}`
  }

  private getEventHandler (eventType: string): (delta: Delta) => void {
      const handler = Reflect.getMetadata(eventType, this.rootEntity)
      return handler
  }
}
