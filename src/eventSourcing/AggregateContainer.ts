import * as Uuid from './UUID'
import { AggregateError } from './AggregateError'
import { ChangeEvent, EntityEvent, Message, UNINITIALISED_AGGREGATE_VERSION } from './MessageTypes'
import { EntityBase } from './EntityBase'
import { Aggregate } from './Aggregate'
import { EntityContructor } from '..'
export class AggregateContainer<T extends EntityBase> implements Aggregate {
  public _rootEntity: T | undefined
  private events: Array<EntityEvent> = []
  private changes: Array<EntityEvent> = []
  private causationId?: Uuid.UUID
  private correlationId?: Uuid.UUID

  get changeVersion(): number {
    return this.version
  }


  get rootEntity(): T {
    if (!this._rootEntity) {
      // this._rootEntity =   this.aggregateRootProvider(this.observe.bind(this))
      this._rootEntity = new this.activator(this.observe.bind(this))
    }
    return this._rootEntity
  }

 

  constructor(
    public readonly id: Uuid.UUID,
    // private aggregateRootProvider: (observer : EntityChangedObserver) => T, 
    private activator: EntityContructor<T>,
    private version = UNINITIALISED_AGGREGATE_VERSION) {    
  }

  loadFromHistory(history: EntityEvent[]): void {
    this.events = this.events.concat(history)
    history.forEach(evt => {
      const expectedVersion = this.version + 1
      if (expectedVersion !== evt.version) {
        throw new AggregateError(typeof this, 'Failed to load unexpected event version')
      }

      this.applyEvent(evt.event)
      this.version = evt.version
    })
  }

  // TODO : BLAIR Maybe use EntityEvent here and store snapshots with their version
  loadFromVersion(changeEvents: ChangeEvent[], version: number): void {
    changeEvents.forEach(evt => this.applyEvent(evt))
    this.version = version
  }

  uncommittedChanges(): EntityEvent[] {
    return this.changes.map(x => ({
      version: x.version,
      event: {
        ...x.event,
        causationId: this.causationId ?? x.event.causationId,
        correlationId: this.correlationId ?? x.event.causationId
      }
    }))
  }

  markChangesAsCommitted(version: number): void {
    this.changes = []
    this.version = version
  }

  toString() {
    return `AggregateRoot:${this.id}, Version:${this.changeVersion}`
  }

  /** @deprecated use withCausationMessage instead */
  withCausation(causationId: Uuid.UUID): this {
    this.causationId = causationId
    return this
  }

  /** @deprecated use withCausationMessage instead */
  withCorrelation(correlationId: Uuid.UUID): this {
    this.correlationId = correlationId
    return this
  }

  withCausationMessage(causationMessage: Message): this {
    this.causationId = causationMessage.id
    this.correlationId = causationMessage.correlationId
    return this
  }

  /** Observes a new change to a Domain Object */
  private observe(evt: ChangeEvent) {
    const entityEvent = {
      event: evt,
      version: this.currentVersionFromChanges() + 1
    }
    this.changes.push(entityEvent)
    this.events.push(entityEvent)
  }

  private currentVersionFromChanges(): number {
    return this.changes.length ? this.changes[this.changes.length - 1].version : this.version
  }

  /** Actions an event on the domain object */
  private applyEvent(evt: ChangeEvent) {
    this.rootEntity.handleChangeEvent(evt)
  }


  // These methods are not part of the aggregate contract
  latestDateTimeFromEvents(): string {
    return this.events.reduce(
      (accum: string, curr) =>
        new Date(curr.event.dateTimeOfEvent).getTime() > new Date(accum).getTime() ? curr.event.dateTimeOfEvent : accum,
      new Date(0).toISOString()
    )
  }

  countOfEvents(): number {
    return this.events.length
  }
}
