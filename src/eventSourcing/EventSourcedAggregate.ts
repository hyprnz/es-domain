import 'reflect-metadata'
import { UUID } from './UUID'
import { AggregateError } from './AggregateError'
import { Aggregate, Parent } from './Aggregate'
import { EventSourcedEntity } from './Entity'
import { EntityEvent, UNINITIALISED_AGGREGATE_VERSION } from './MessageTypes'


export class EventSourcedAggregate<T extends EventSourcedEntity> implements Aggregate {
  id: UUID
  public readonly rootEntity: T 
  private readonly entities = new Set<EventSourcedEntity>()

  private version: number
  private changes: Array<EntityEvent> = []

  private thisAsParent: Parent 

  constructor(id: UUID, makeRootEntity: (id: UUID, aggregate: Parent)=>T){
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
      registerEntity: (entity: EventSourcedEntity) => { 
        this.entities.add(entity)
      }
    }

    this.rootEntity = makeRootEntity(id, this.thisAsParent)
  }

  get changeVersion(): number {
    return this.version
  }

  loadFromHistory(history: EntityEvent[]): void{
    history.forEach(evt => {
      const expectedVersion = this.version + 1
      if(expectedVersion !== evt.version){
        throw new AggregateError( typeof this,  'Failed to load unexpected event version') 
      }

      const handler = this.getEventHandler(evt.event.eventType)
      handler(evt.event.payload)

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

  private getEventHandler (eventType: string): (payload: Record<string, any>) => void {
    for (const entity of this.entities) {
      const handler = Reflect.getMetadata(`${eventType}Handler`, entity)
      if (handler) return (payload) => handler.call(entity, payload)
    }

    throw new AggregateError(typeof this, `Failed to find handler for event type: ${eventType}`) 
  }
}
