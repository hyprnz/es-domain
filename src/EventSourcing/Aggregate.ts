import * as Uuid from './UUID'
import { AggregateError } from './AggregateError'
import { IChangeEvent, IAggregateRoot, IEntityEvent, IParentAggregateRoot, IAggregate } from './EventSourcingTypes'

export type EventHandler = <T extends IChangeEvent>(evt: T) => void

export abstract class Entity implements IAggregate {
  id: Uuid.UUID
  protected readonly parentId: Uuid.UUID
  private handlers = new Map<string, { handlers: Array<EventHandler> }>()

  constructor(private parent: IParentAggregateRoot) {
    // Uninitialised, we are going to load an exisitng 
    this.id = Uuid.EmptyUUID
    this.parentId = parent.id()
  }

  applyChangeEvent(evt: IEntityEvent): void {
    this.applyEvent(evt.event)
  }

  toString() {
    return `AggregateEntity ${typeof this}]:${this.id}, Parent:${this.parent.id}`
  }

  /** Register event handlers */
  protected registerHandler(eventType: string, handler: EventHandler) {
    const exists = this.handlers.has(eventType)
    if (exists) this.handlers.get(eventType).handlers.push(handler)
    else this.handlers.set(eventType, { handlers: [handler] })
  }

  /** Applies a new chnage to the Domain Object */
  protected applyChange(evt: IChangeEvent): void {
    this.applyEvent(evt)
    this.parent.addChangeEvent(evt)
  }

  /** Actions an event on the domain object */
  private applyEvent(evt: IChangeEvent) {
    const eventHandler = this.handlers.get(evt.eventType)
    if (!eventHandler) throw new AggregateError(typeof this, `Event Handlers not found for eventType:${evt.eventType}`)
    eventHandler.handlers.forEach(handler => handler(evt))
  }
}

