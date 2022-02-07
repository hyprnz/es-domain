import * as Uuid from './UUID'
import { AggregateError } from './AggregateError'
import { IChangeEvent, IAggregateRoot, IEntityEvent, IParentAggregateRoot, UNINITIALISED_AGGREGATE_VERSION } from './EventSourcingTypes'


export type EventHandler<T = any> = <T extends IChangeEvent>(evt: T) => void

export abstract class AggregateRoot implements IAggregateRoot{
  
  id: Uuid.UUID
  get changeVersion() : number { return this.version}

  private version: number
  private changes: Array<IEntityEvent> = []
  // private handlers = new Map<string, {handlers:Array<EventHandler>}>()
  protected thisAsParent: IParentAggregateRoot 

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

  loadFromHistory(history: IEntityEvent[]): void{
    history.forEach(evt => {
      const expectedVersion = this.version + 1
      if(expectedVersion !== evt.version){
        throw new AggregateError( typeof this,  'Failed to load unexpected event version') 
      }

      this.applyEvent(evt.event)
      this.version = evt.version
    })
  }

  uncommittedChanges(): IEntityEvent[] {
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
    return `AggregateRoot ${typeof this}]:${this.id}, Version:${this.changeVersion}`
  }

  // /** Register event handlers */
  // protected registerHandler<T>(eventType:string, handler: EventHandler){
  //   const boundHandler = handler.bind(this)
  //   const exists = this.handlers.has(eventType)
  //   if(exists) this.handlers.get(eventType).handlers.push(boundHandler)
  //   else this.handlers.set(eventType, {handlers: [boundHandler]})
  // }

  /** Applies a new chnage to the Domain Object */
  protected applyChange(evt: IChangeEvent){
    this.applyEvent(evt)
    this.changes.push({
      event:evt, 
      version: UNINITIALISED_AGGREGATE_VERSION
    })
  }
  
  /** Actions an event on the domain object */
  private applyEvent(evt: IChangeEvent){
    const eventHandler = this.makeEventHandler(evt)
    if(!eventHandler) throw new AggregateError( this.toString(), `AggregateRoot Event Handlers not found for eventType:${evt.eventType}`) 
    eventHandler()    
  }

  protected abstract makeEventHandler(evt: IChangeEvent) : (() => void) | undefined
}

