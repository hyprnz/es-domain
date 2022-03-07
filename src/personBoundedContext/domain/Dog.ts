import { Parent } from '../../eventSourcing/Aggregate';
import { Emits } from '../../eventSourcing/decorators';
import { EventSourcedEntity } from '../../eventSourcing/Entity';
import { UUID } from '../../eventSourcing/UUID';
import { DogMicrochippedEvent } from '../events/dogEvents';

export class Dog implements EventSourcedEntity {
  private isMicrochipped: boolean;
  private dogName: string;

  constructor(readonly id: UUID, readonly aggregate: Parent, dogName: string) {
    this.aggregate.registerEntity(this);

    this.dogName = dogName
    this.isMicrochipped = false
  }

  @Emits(DogMicrochippedEvent)
  microchip() {
    this.isMicrochipped = true;
  }
}
