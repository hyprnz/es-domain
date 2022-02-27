import { UUID } from './UUID'
import { AggregateError } from './AggregateError'
import { Delta, DomainObject, EntityEvent, ParentAggregate, UNINITIALISED_AGGREGATE_VERSION } from './EventSourcingTypes'

export class Aggregate<T extends {id: UUID} = {id: UUID}> {
  id: UUID
  public readonly rootEntity: T 
  public readonly childEntities = new Set<DomainObject>()

  private version: number
  private changes: Array<EntityEvent> = []
  protected thisAsParent: ParentAggregate 

  constructor(id: UUID, makeRootEntity: (id: UUID, aggregate: ParentAggregate)=>T){
    this.id = id
    this.version = UNINITIALISED_AGGREGATE_VERSION

    this.thisAsParent = {
      id: () => this.id,
      addChangeEvent: (evt) => this.changes.push({
        event:evt, 
        version: UNINITIALISED_AGGREGATE_VERSION
      }),
      registerAsChildEntity: (entity: DomainObject) => { 
        this.childEntities.add(entity)
      }
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
    if (handler) return (delta) => handler.call(this.rootEntity, delta)

    for (const entity of this.childEntities) {
      const childHandler = Reflect.getMetadata(eventType, entity)
      if (childHandler) return (delta) => childHandler.call(entity, delta)
    }

    throw new Error(`Handler not registered for event type ${eventType}`)
  }
}
