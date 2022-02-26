import * as Uuid from './UUID'
import { AggregateError } from './AggregateError'
import { ChangeEvent, EntityEvent, ParentAggregate, UNINITIALISED_AGGREGATE_VERSION } from './EventSourcingTypes'
import { EntityBase } from './Entity'

export class Aggregate<T extends {id: Uuid.UUID} = {id: Uuid.UUID}> {
  id: Uuid.UUID
  public readonly rootEntity: T 

  private version: number
  private changes: Array<EntityEvent> = []
  protected thisAsParent: ParentAggregate 

  constructor(id:Uuid.UUID, makeRootEntity: (id:Uuid.UUID, aggregate: ParentAggregate)=>T){
    if(id) this.id = id
    // Uninitialised, we are going to load an exisitng 
    else this.id = Uuid.EmptyUUID

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

      // this.applyEvent(evt.event)
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

  /** Applies a new chnage to the Domain Object */
  // protected applyChange(evt: ChangeEvent){
  //   this.applyEvent(evt)
  //   this.changes.push({
  //     event:evt, 
  //     version: UNINITIALISED_AGGREGATE_VERSION
  //   })
  // }
  
  /** Actions an event on the domain object */
  // private applyEvent(evt: ChangeEvent){
  //   const eventHandler = this.makeEventHandler(evt)
  //   if(!eventHandler) throw new AggregateError( this.toString(), `AggregateRoot Event Handlers not found for eventType:${evt.eventType}`) 
  //   eventHandler()    
  // }

  // protected makeEventHandler(evt: ChangeEvent): (() => void) | undefined {
  //   return () => {
  //     this.rootEntity.applyChangeEvent(evt)
  //     this.id = evt.aggregateRootId
  //   }
  // }
}
