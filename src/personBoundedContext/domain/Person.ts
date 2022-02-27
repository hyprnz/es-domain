import { Aggregate } from '../../EventSourcing/Aggregate'
import { AggregateError } from '../../EventSourcing/AggregateError'
import { Emits } from '../../EventSourcing/decorators'
import { ParentAggregate } from '../../EventSourcing/EventSourcingTypes'
import { UUID } from '../../EventSourcing/UUID'
import { PersonCreatedEvent } from '../events/personEvents'

export class Person {
  private name?: string;
  private isCool?: boolean;
  constructor(readonly id: UUID, readonly aggregate: ParentAggregate) {}

  create(firstName:string, lastName = "Smith"): Person {
    if (!firstName.length) throw new Error("Name must have at least one character!")
    this.applyCreate({
      name: firstName + " " + lastName
    })
    return this
  }

  @Emits(PersonCreatedEvent)
  private applyCreate(change: { name: string }): void {
    // state changes inherent to action/event type
    this.isCool = true

    // `change` contains data specific to this call...
    this.name = change.name
  }

  // private static readonly eventHandlers: Record<string, Array<StaticEventHandler<Person>>> = {
  //   [PersonCreatedEvent.eventType]: [(person, evt) => person.id = evt.aggregateRootId],
  // }
}