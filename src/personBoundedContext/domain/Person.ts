import { Aggregate } from '../../EventSourcing/Aggregate'
import { AggregateError } from '../../EventSourcing/AggregateError'
import { Emits } from '../../EventSourcing/decorators'
import { EntityBase } from '../../EventSourcing/Entity'
import { ParentAggregate, ChangeEvent, StaticEventHandler } from '../../EventSourcing/EventSourcingTypes'
import * as Uuid from '../../EventSourcing/UUID'
import { PersonCreatedEvent } from '../events/personEvents'

export class Person {
  private name?: string;
  constructor(readonly id: Uuid.UUID, readonly aggregate: ParentAggregate) {
  }

  @Emits(PersonCreatedEvent)
  create(): Person {
    this.name = "Susan"
    return this
  }

  // protected override makeEventHandler(evt: ChangeEvent): (() => void) | undefined {
  //   const handlers: Array<() => void> = []

  //   const handler = Person.eventHandlers[evt.eventType]
  //   if (handler) handlers.push(() => handler.forEach(x => x.call(this, this, evt)))

  //   const child = this.alarms.get(evt.entityId)
  //   if (child) handlers.push(() => child.applyChangeEvent(evt))

  //   return (handlers.length)
  //     ? () => { handlers.forEach(x => x()) }
  //     : undefined
  //   return undefined
  // }

  // private static readonly eventHandlers: Record<string, Array<StaticEventHandler<Person>>> = {
  //   [PersonCreatedEvent.eventType]: [(person, evt) => person.id = evt.aggregateRootId],
  // }
}