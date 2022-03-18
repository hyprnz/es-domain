import { AbstractChangeEvent } from "../..";
import { UUID } from "../../eventSourcing/UUID";

export class DogMicroChippedEvent extends AbstractChangeEvent {
  static readonly eventType = "Dog.Microchipped";

  constructor(
    personId: UUID,
    dogId: UUID,
    ){
    super(DogMicroChippedEvent.eventType, personId, dogId)
  }
}