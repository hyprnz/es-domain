import * as Uuid from './UUID'
import { AggregateError } from './AggregateError'
import { IChangeEvent, IParentAggregateRoot, IEntityAggregate } from './EventSourcingTypes'

export type EventHandler = <T extends IChangeEvent>(evt: T) => void
export type StaticEventHandler<E> = (entity: E, evt: IChangeEvent) => void

export abstract class Entity implements IEntityAggregate {
  id: Uuid.UUID
  protected readonly parentId: Uuid.UUID
  // private handlers = new Map<string, { handlers: Array<EventHandler> }>()

  constructor(private parent: IParentAggregateRoot) {
    // Uninitialised Entity, we are going to load an exisitng 
    this.id = Uuid.EmptyUUID
    this.parentId = parent.id()
  }

  applyChangeEvent(evt: IChangeEvent): void {
    this.applyEvent(evt)
  }

  toString() {
    return `Entity ${this.id}, Parent:${this.parent.id}`
  }

  /** Applies a new chnage to the Domain Object */
  protected applyChange(evt: IChangeEvent): void {
    this.applyEvent(evt)
    this.parent.addChangeEvent(evt) //TOOD : Should just store against the parent with out performing any actions
  }

  // Applies an existing event to the Entity
  private applyEvent(evt: IChangeEvent) {
    const eventHandler = this.makeEventHandler(evt)
    if (!eventHandler) throw new AggregateError(this.toString(), `Event Handlers not found for eventType:${evt.eventType}`)
    eventHandler()
  }

  protected abstract makeEventHandler(evt: IChangeEvent) : (() => void) | undefined
}

