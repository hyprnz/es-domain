import { AggregateError } from '../../EventSourcing/AggregateError'
import { EntityBase } from '../../EventSourcing/Entity'
import { ParentAggregate, ChangeEvent, StaticEventHandler } from '../../EventSourcing/EventSourcingTypes'
import * as Uuid from '../../EventSourcing/UUID'
import { PersonCreatedEvent, AlarmCreatedEvent, AlarmDestroyedEvent } from '../events/personEvents'

export class Person extends EntityBase {
  constructor(parent: ParentAggregate, id?: Uuid.UUID) {  // id?: Uuid.UUID
    super(parent)

    if (id) {
      // This is a new object
      this.applyChange(new PersonCreatedEvent(this.parentId, id))
    }
  }

  toString() { return `PersonEntity:${this.id}` }

  protected override makeEventHandler(evt: ChangeEvent): (() => void) | undefined {
  //   const handlers: Array<() => void> = []

  //   const handler = Person.eventHandlers[evt.eventType]
  //   if (handler) handlers.push(() => handler.forEach(x => x.call(this, this, evt)))

  //   const child = this.alarms.get(evt.entityId)
  //   if (child) handlers.push(() => child.applyChangeEvent(evt))

  //   return (handlers.length)
  //     ? () => { handlers.forEach(x => x()) }
  //     : undefined
  return undefined
  }

  private static readonly eventHandlers: Record<string, Array<StaticEventHandler<Person>>> = {
    [PersonCreatedEvent.eventType]: [(person, evt) => person.id = evt.aggregateRootId],
  }
}