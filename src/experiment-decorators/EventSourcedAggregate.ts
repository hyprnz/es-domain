import 'reflect-metadata'
import { AggregateError } from '../eventSourcing/AggregateError'
import { UUID } from '../util/UUID'
import { Aggregate, Parent } from './Aggregate'
import { EventSourcedEntity } from './Entity'
import { ChangeEvent, EntityEvent, UNINITIALISED_AGGREGATE_VERSION } from './MessageTypes'

export class EventSourcedAggregate<T extends EventSourcedEntity> implements Aggregate {
  id: UUID
  public readonly rootEntity: T
  private readonly entities = new Set<EventSourcedEntity>()
  private causationId?: UUID
  private correlationId?: UUID

  private version: number
  private changes: Array<EntityEvent> = []

  private thisAsParent: Parent

  constructor(id: UUID, makeRootEntity: (id: UUID, aggregate: Parent) => T) {
    this.id = id
    this.version = UNINITIALISED_AGGREGATE_VERSION

    this.thisAsParent = {
      id: () => this.id,
      correlationId: () => this.correlationId,
      causationId: () => this.causationId,
      addChangeEvent: evt => {
        const currentVersion = this.changes.length ? this.changes[this.changes.length - 1].version : this.version
        this.changes.push({
          event: evt,
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

  loadFromHistory(history: EntityEvent[]): void {
    history.forEach(evt => {
      const expectedVersion = this.version + 1
      if (expectedVersion !== evt.version) {
        throw new AggregateError(typeof this, 'Failed to load unexpected event version')
      }

      const handler = this.getEventHandler(evt.event.eventType)
      handler(evt.event)

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

  toString() {
    return `AggregateRoot:${this.id}, Version:${this.version}`
  }

  withCausation(causationId: UUID): this {
    this.causationId = causationId
    return this
  }

  withCorrelation(correlationId: UUID): this {
    this.correlationId = correlationId
    return this
  }

  withCausationMessage(message: { causationId: UUID; correlationId: UUID }): this {
    this.causationId = message.causationId
    this.correlationId = message.correlationId
    return this
  }

  private getEventHandler(eventType: string): (event: ChangeEvent) => void {
    for (const entity of this.entities) {
      // This is convineient however i don't like this pattern as over time as events chnage we will need to think up more obscure names
      // for these events so that they don't collide with legacy event names. Maybe rather than event type, event schema could be a better implmentation
      const handler = Reflect.getMetadata(`${eventType}Handler`, entity)
      if (handler) return payload => handler.call(entity, payload)
    }

    throw new AggregateError(typeof this, `Failed to find handler for event type: ${eventType}`)
  }
}
