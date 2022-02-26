import { ChangeEvent } from "../../EventSourcing/EventSourcingTypes";
import * as Uuid from "../../EventSourcing/UUID";

export class PersonDomainError  extends Error {
  constructor(public readonly aggregateRootId: Uuid.UUID, message:string){
    super(message)
  }
}
abstract class AbstractChangeEvent implements ChangeEvent{
  readonly id: Uuid.UUID;
  constructor(public eventType:string, public readonly aggregateRootId: Uuid.UUID, readonly entityId: Uuid.UUID){
    this.id = Uuid.createV4()
  }
}

export class PersonCreatedEvent implements ChangeEvent {
  static readonly  eventType = 'Person.CreatedEvent'
  readonly id: Uuid.UUID;
  readonly eventType : string

  constructor(public readonly aggregateRootId: Uuid.UUID, readonly entityId: Uuid.UUID){
    this.eventType = PersonCreatedEvent.eventType
    this.id = Uuid.createV4()
  }
}