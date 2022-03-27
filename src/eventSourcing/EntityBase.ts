import * as Uuid from './UUID'
import { AggregateError } from './AggregateError'
import { ChangeEvent } from './MessageTypes'
import { Entity } from './Entity'
import { EntityChangedObserver } from './Aggregate'

export abstract class EntityBase implements Entity {
  private _id: Uuid.UUID | undefined
  get id(): Uuid.UUID {
    if (!this._id) {
      throw new Error(`Entity id not initialised`)
    }
    return this._id
  }

  set id(value) {
    this._id = value
  }

  protected constructor(
    protected observer: EntityChangedObserver,
    private processor: EventProcessor = new EventProcessor(observer, e => this.makeEventHandler(e))
  ) {}

  protected abstract makeEventHandler(evt: ChangeEvent): (() => void) | undefined

  handleChangeEvent(event: ChangeEvent): void {
    this.processor.handleChangeEvent(event)
  }

  applyChangeEvent(event: ChangeEvent): void {
    this.processor.applyChangeEvent(event)
  }
}

export class EventProcessor {
  constructor(
    private observer: EntityChangedObserver,
    private makeEventHandler: (evt: ChangeEvent) => (() => void) | undefined
  ) {}

  /** Handles change event when loading through handlers */
  handleChangeEvent(evt: ChangeEvent): void {
    this.applyEvent(evt)
  }

  /** Applies a new change to the Domain Object */
  applyChangeEvent(evt: ChangeEvent): void {
    this.applyEvent(evt)
    this.observer(evt)
  }

  /** Applies an existing event to the Entity **/
  private applyEvent(evt: ChangeEvent) {
    const eventHandler = this.makeEventHandler(evt)
    if (!eventHandler) throw new AggregateError(this.toString(), `Event Handlers not found for eventType:${evt.eventType}`)
    eventHandler()
  }
}
