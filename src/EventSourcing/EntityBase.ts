import * as Uuid from './UUID'
import { AggregateError } from './AggregateError'
import { ChangeEvent, ParentAggregate, Entity } from './EventSourcingTypes'



export abstract class EntityBase implements Entity {
  public id: Uuid.UUID
  protected get parentId() {return this.parent.id()}
  // private handlers = new Map<string, { handlers: Array<EventHandler> }>()

  constructor(protected parent: ParentAggregate) {
    // Uninitialised Entity, we are going to load an exisitng 
    this.id = Uuid.EmptyUUID
  }

  applyChangeEvent(evt: ChangeEvent): void {
    this.applyEvent(evt)
  }

  toString() {
    return `Entity ${this.id}, Parent:${this.parent.id}`
  }

  /** Applies a new change to the Domain Object */
  protected applyChange(evt: ChangeEvent): void {
    this.applyEvent(evt)
    this.parent.addChangeEvent(evt) //TOOD : Should just store against the parent with out performing any actions
  }

  // Applies an existing event to the Entity
  private applyEvent(evt: ChangeEvent) {
    const eventHandler = this.makeEventHandler(evt)
    if (!eventHandler) throw new AggregateError(this.toString(), `Event Handlers not found for eventType:${evt.eventType}`)
    eventHandler()
  }

  protected abstract makeEventHandler(evt: ChangeEvent) : (() => void) | undefined
}

