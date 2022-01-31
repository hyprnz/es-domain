import * as Uuid from './UUID'
import { AggregateError } from './AggregateError'
import { IChangeEvent, IAggregateRoot, IEntityEvent } from './EventSourcingTypes'

const UNINITIALISED_AGGREGATE_VERSION = -1
export type EventHandler = <T extends IChangeEvent>(evt: T) => void

export abstract class Aggregate implements IAggregateRoot{
  
  id: Uuid.UUID
  get changeVersion() : number { return this.version}

  private version: number
  private changes: Array<IEntityEvent> = []
  private handlers = new Map<string, {handlers:Array<EventHandler>}>()

  constructor(){
    this.id = Uuid.EmptyUUID
    this.version = UNINITIALISED_AGGREGATE_VERSION
  }

  private applyEvent(evt: IChangeEvent){
    const eventHandler = this.handlers.get(evt.eventType)
    if(eventHandler){
      eventHandler.handlers.forEach(handler => handler(evt))
    }
  }

  protected applyChange(evt: IChangeEvent){
    this.applyEvent(evt)
    this.changes.push({
      event:evt, 
      version: UNINITIALISED_AGGREGATE_VERSION
    })
  }

  protected registerHandler(eventType:string, handler: EventHandler){
    const exists = this.handlers.has(eventType)
    if(exists) this.handlers.get(eventType).handlers.push(handler)
    else this.handlers.set(eventType, {handlers: [handler]})
  }


  loadFromHistory(history: IEntityEvent[]) {
    history.forEach(evt => {
      const expectedVersion = this.version + 1.0
      if(expectedVersion !== evt.version){
        throw new AggregateError( typeof this,  'Failed to load unexpected event version') 
      }

      this.applyEvent(evt.event)
      this.version = expectedVersion

    })
  }
  uncommittedChanges(): IEntityEvent[] {
    // Probably a better way of doing this
    const uncommited = [...this.changes]
    uncommited.forEach((e, index) => e.version = this.version + index + 1)
    return uncommited
  }
  markChangesAsCommitted(version: number): void {
    this.changes = []
    this.version = version
  }

  toString(){
    return `Aggregate ${typeof this}]:${this.id}, Version:${this.changeVersion}`
  }
}

