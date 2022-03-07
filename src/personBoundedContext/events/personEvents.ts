import { AbstractChangeEvent } from "../..";
import { UUID } from "../../eventSourcing/UUID";

export class PersonDomainError extends Error {
  constructor(public readonly aggregateRootId: UUID, message:string){
    super(message)
  }
}

export interface CreatePersonPayload {
  name: string
}

export class PersonCreatedEvent extends AbstractChangeEvent {
  static readonly eventType = 'Person.Created'

  constructor(
    personId: UUID,
    _: UUID,
    readonly payload: CreatePersonPayload
    ){
    super(PersonCreatedEvent.eventType, personId, personId)
  }
}

export interface AdoptDogPayload {
  dogId: UUID,
  dogName: string
}

export class DogAdoptedEvent extends AbstractChangeEvent {
  static readonly eventType = 'Person.DogAdopted'

  constructor(
    personId: UUID,
    _: UUID,
    readonly payload: AdoptDogPayload
    ){
    super(DogAdoptedEvent.eventType, personId, personId)
  }
}