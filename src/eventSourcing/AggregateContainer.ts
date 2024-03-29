import { EntityConstructor, EntityConstructorPayload } from '..'
import * as Uuid from '../util/UUID'
import { Aggregate } from './Aggregate'
import { AggregateError } from './AggregateError'
import { ChangeEvent, EntityEvent, Message, UNINITIALISED_AGGREGATE_VERSION } from './contracts/MessageTypes'
import { EntityBase } from './EntityBase'

export class AggregateContainer<T extends EntityBase, U extends EntityConstructorPayload = EntityConstructorPayload>
  implements Aggregate
{
  public _rootEntity: T | undefined
  /** Not sure why we keep this this is dangerous!! */
  private events: Array<EntityEvent> = []
  private changes: Array<EntityEvent> = []
  private causationId?: Uuid.UUID
  private correlationId?: Uuid.UUID

  get changeVersion(): number {
    return this.version
  }

  get rootEntity(): T {
    if (!this._rootEntity) throw new Error('Root entity not initialised')
    return this._rootEntity
  }

  get id(): Uuid.UUID {
    if (!this._rootEntity) {
      throw new Error('Not Found')
    }
    return this._rootEntity.id
  }

  constructor(private activator: EntityConstructor<T, U>, private version = UNINITIALISED_AGGREGATE_VERSION) {}

  createNewAggregateRoot(payload: U): T {
    if (this._rootEntity) {
      throw new AggregateError(`${AggregateContainer.name}:makeNewAggregateRoot`, 'AggregateRoot already exists')
    }
    this._rootEntity = new this.activator(this.observe.bind(this), {
      ...payload
    } as U)

    return this._rootEntity
  }

  loadFromHistory(history: EntityEvent[]): void {
    if (this._rootEntity) {
      throw new AggregateError(`${AggregateContainer.name}:loadFromHistory`, 'AggregateRoot already exists')
    }
    if (history.length) {
      this.events = this.events.concat(history)
      history.forEach(evt => {
        const expectedVersion = this.version + 1
        if (expectedVersion !== evt.version) {
          throw new AggregateError(typeof this, 'Failed to load unexpected event version')
        }

        if (!this._rootEntity) {
          const params = this.activator.toCreationParameters(evt.event)
          this._rootEntity = new this.activator(this.observe.bind(this), params, true)
        }

        this.applyEvent(evt.event)
        this.version = evt.version
      })
    }
  }

  // TODO : BLAIR Maybe use EntityEvent here and store snapshots with their version
  loadFromVersion(changeEvents: ChangeEvent[], version: number): void {
    if (!this._rootEntity && changeEvents.length > 0) {
      const params = this.activator.toCreationParameters(changeEvents[0])
      this._rootEntity = new this.activator(this.observe.bind(this), params, true)
    }
    changeEvents.forEach(evt => this.applyEvent(evt))
    this.version = version
  }

  uncommittedChanges(): EntityEvent[] {
    return this.changes.map(x => ({
      version: x.version,
      event: {
        ...x.event,
        causationId: this.causationId ?? x.event.causationId,
        correlationId: this.correlationId ?? x.event.correlationId
      }
    }))
  }

  /**
   * Mark changes as commited and update aggregate version, to the version of the last event
   * @param  version - Deprecated: this parameter is ignored and will be removed in future versions
   */
  markChangesAsCommitted(version?: number): void {
    if (this.changes.length === 0) return

    const expectedVersion = this.changes[this.changes.length - 1].version
    if (version && expectedVersion !== version) throw new AggregateError(typeof this, 'Failed to commit unexpected event version')

    this.changes = []
    this.version = expectedVersion
  }

  toString() {
    return `AggregateRoot:${this.id}, Version:${this.changeVersion}`
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

  // These methods are not part of the aggregate contract ?
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
