import { ChangeEvent } from "../../EventSourcing/EventSourcingTypes";
import * as Uuid from "../../EventSourcing/UUID";

export class PersonDomainError  extends Error {
  constructor(public readonly aggregateRootId: Uuid.UUID, message:string){
    super(message)
  }
}

export abstract class AbstractChangeEvent implements ChangeEvent{
  readonly id: Uuid.UUID;
  abstract readonly eventType: string
  constructor(public readonly aggregateRootId: Uuid.UUID, readonly entityId: Uuid.UUID){
    this.id = Uuid.createV4()
  }
}

export class PersonCreatedEvent extends AbstractChangeEvent {
  static readonly eventType = 'Person.CreatedEvent'
  readonly eventType = PersonCreatedEvent.eventType

  constructor(public readonly aggregateRootId: Uuid.UUID, readonly entityId: Uuid.UUID){
    super(aggregateRootId, entityId)
  }
}