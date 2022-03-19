import * as Uuid from './UUID'
import { AggregateError } from './AggregateError'
import { ChangeEvent, EntityEvent, UNINITIALISED_AGGREGATE_VERSION } from './MessageTypes'
import { EntityBase } from './EntityBase'
import { Aggregate } from './Aggregate'

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
      throw new Error(`Root has not been initialised`)
    }
    return this._rootEntity
  }

  set rootEntity(value) {
    this._rootEntity = value
  }

  get id(): Uuid.UUID {
    return this.rootEntity.id
  }

  constructor(private version = UNINITIALISED_AGGREGATE_VERSION) {}

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

  markSnapShotAsCommitted(): void {
    this.changes = []
  }

  markChangesAsCommitted(version: number): void {
    this.changes = []
    this.version = version
  }

  toString() {
    return `AggregateRoot:${this.id}, Version:${this.changeVersion}`
  }

  withCausation(causationId: Uuid.UUID): this {
    this.causationId = causationId
    return this
  }

  withCorrelation(correlationId: Uuid.UUID): this {
    this.correlationId = correlationId
    return this
  }

  /** Observes a new change to a Domain Object */
  observe(evt: ChangeEvent) {
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
}
