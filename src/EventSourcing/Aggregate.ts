import { UUID } from './UUID'
import { AggregateError } from './AggregateError'
import { Delta, EntityEvent, ParentAggregate, UNINITIALISED_AGGREGATE_VERSION, Entity } from './EventSourcingTypes'

export class Aggregate<T extends {id: UUID} = {id: UUID}> {
  id: UUID
  public readonly rootEntity: T 
  private readonly childEntities = new Set<Entity>()

  private version: number
  private changes: Array<EntityEvent> = []

  private thisAsParent: ParentAggregate 

  constructor(id: UUID, makeRootEntity: (id: UUID, aggregate: ParentAggregate)=>T){
    this.id = id
    this.version = UNINITIALISED_AGGREGATE_VERSION

    this.thisAsParent = {
      id: () => this.id,
      addChangeEvent: (evt) => {
        const currentVersion = this.changes.length 
          ? this.changes[this.changes.length - 1].version
          : this.version
        this.changes.push({
          event:evt, 
          version: currentVersion + 1
        })
      },
      registerChildEntity: (entity: Entity) => { 
        this.childEntities.add(entity)
      }
    }

    this.rootEntity = makeRootEntity(id, this.thisAsParent)
  }

  loadFromHistory(history: EntityEvent[]): void{
    history.forEach(evt => {
      const expectedVersion = this.version + 1
      if(expectedVersion !== evt.version){
        throw new AggregateError( typeof this,  'Failed to load unexpected event version') 
      }

      const handler = this.getEventHandler(evt.event.eventType)
      handler(evt.event.delta)

      this.version = evt.version
    })
  }

  uncommittedChanges(): EntityEvent[] {
    return [...this.changes]
  }

  markChangesAsCommitted(): void {
    if (!this.changes.length) return
    this.version = this.changes[this.changes.length - 1].version
    this.changes = []
  }

  toString(){
    return `AggregateRoot:${this.id}, Version:${this.version}`
  }

  private getEventHandler (eventType: string): (delta: Delta) => void {
    const handler = Reflect.getMetadata(`${eventType}Handler`, this.rootEntity)
    if (handler) return (delta) => handler.call(this.rootEntity, delta)

    for (const entity of this.childEntities) {
      const childHandler = Reflect.getMetadata(`${eventType}Handler`, entity)
      if (childHandler) return (delta) => childHandler.call(entity, delta)
    }

    throw new AggregateError(typeof this, `Failed to find handler for event type: ${eventType}`) 
  }
}
