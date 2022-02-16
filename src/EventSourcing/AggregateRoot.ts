import * as Uuid from './UUID'
import { AggregateError } from './AggregateError'
import { ChangeEvent, Aggregate, EntityEvent, ParentAggregate, UNINITIALISED_AGGREGATE_VERSION } from './EventSourcingTypes'
import { EntityBase } from './Entity'


// For aggregate roots consider not extending them to be trated as an entity.
// Instead aggregate root could be a container that has one entity that is the RootEntity of the Aggregate !!
// this would be a switch from inheritance to composition
// This may be a little clunky to use, but worth exploring
// PROS : we would end up with a single implementation of aggregateRoot with a generic for the RootEntity Type
// CONS : When we create and hydrate an aggregate root, we then need to access the root entity via a getter. 
//        We must still hold on to the aggregate root as it would be needed to persist any changes.
//        Though if we have a layered system, the service layer could be responsible for creating aggregate roots 
//        It just passes / makes use of the entities to perform domain actions

export abstract class AggregateRoot implements Aggregate {
  
  id: Uuid.UUID
  get changeVersion() : number { return this.version}

  private version: number
  private changes: Array<EntityEvent> = []
  protected thisAsParent: ParentAggregate 

  constructor(){
    // Uninitialised, we are going to load an exisitng 
    this.id = Uuid.EmptyUUID
    this.version = UNINITIALISED_AGGREGATE_VERSION

    this.thisAsParent = {
      id: () => this.id,
      addChangeEvent: (evt) => this.changes.push({
        event:evt, 
        version: UNINITIALISED_AGGREGATE_VERSION
      })
    }
  }

  loadFromHistory(history: EntityEvent[]): void{
    history.forEach(evt => {
      const expectedVersion = this.version + 1
      if(expectedVersion !== evt.version){
        throw new AggregateError( typeof this,  'Failed to load unexpected event version') 
      }

      this.applyEvent(evt.event)
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
  protected applyChange(evt: ChangeEvent){
    this.applyEvent(evt)
    this.changes.push({
      event:evt, 
      version: UNINITIALISED_AGGREGATE_VERSION
    })
  }
  
  /** Actions an event on the domain object */
  private applyEvent(evt: ChangeEvent){
    const eventHandler = this.makeEventHandler(evt)
    if(!eventHandler) throw new AggregateError( this.toString(), `AggregateRoot Event Handlers not found for eventType:${evt.eventType}`) 
    eventHandler()    
  }

  protected abstract makeEventHandler(evt: ChangeEvent) : (() => void) | undefined
}


export class AggregateContaner<T extends EntityBase> extends AggregateRoot {
  public readonly rootEntity: T 

  constructor(activator: (parent: ParentAggregate, id?:Uuid.UUID)=>T, id?:Uuid.UUID){
    super()
    if(id) this.id = id
    this.rootEntity = activator(this.thisAsParent, id)
  }

  protected makeEventHandler(evt: ChangeEvent): (() => void) | undefined {
    return () => {
      this.rootEntity.applyChangeEvent(evt)
      this.id = evt.aggregateRootId
    }
  }
}

