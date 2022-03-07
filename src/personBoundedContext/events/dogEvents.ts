import { AbstractChangeEvent } from "../..";
import { UUID } from "../../eventSourcing/UUID";

export class DogMicrochippedEvent extends AbstractChangeEvent {
  static readonly eventType = "Dog.Microchipped";

  constructor(
    personId: UUID,
    dogId: UUID,
    ){
    super(DogMicrochippedEvent.eventType, personId, dogId)
  }
}