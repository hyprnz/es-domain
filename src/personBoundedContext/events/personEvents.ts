import { ChangeEvent } from "../../EventSourcing/EventSourcingTypes";
import { createV4, UUID } from "../../EventSourcing/UUID";

export type EventConstructor<E extends AbstractChangeEvent> = {
    new (
        aggregateRootId: UUID,
        entityId: UUID,
        delta: E["delta"]
    ): E
    eventType: string
}

export class PersonDomainError  extends Error {
  constructor(public readonly aggregateRootId: UUID, message:string){
    super(message)
  }
}

export abstract class AbstractChangeEvent implements ChangeEvent{
  readonly id: UUID;
  abstract readonly eventType: string
  constructor(
    public readonly aggregateRootId: UUID,
    readonly entityId: UUID,
    readonly delta: {[key:string]: any} = {},
    ) {
    this.id = createV4()
  }
}

export class PersonCreatedEvent extends AbstractChangeEvent {
  static readonly eventType = 'Person.Created'
  readonly eventType = PersonCreatedEvent.eventType

  constructor(
    public readonly aggregateRootId: UUID,
    readonly entityId: UUID,
    readonly delta: {name: string},
    ){
    super(aggregateRootId, entityId, delta)
  }
}

export class DogAdoptedEvent extends AbstractChangeEvent {
  static readonly eventType = 'Person.DogAdopted'
  readonly eventType = DogAdoptedEvent.eventType

  constructor(
    public readonly aggregateRootId: UUID,
    readonly entityId: UUID,
    readonly delta: {dogId: UUID, dogName: string},
    ){
    super(aggregateRootId, entityId, delta)
  }
}