import { UUID } from "../../EventSourcing/UUID";
import { AbstractChangeEvent } from "./personEvents";

export class DogMicrochippedEvent extends AbstractChangeEvent {
  constructor(
    public readonly aggregateRootId: UUID,
    readonly entityId: UUID,
    ){
    super(aggregateRootId, entityId)
  }

  static readonly eventType = "Dog.Microchipped";
  readonly eventType = DogMicrochippedEvent.eventType
}