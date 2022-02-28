import { ChildEntity, Emits } from '../../EventSourcing/decorators'
import { Entity, ParentAggregate } from '../../EventSourcing/EventSourcingTypes'
import { UUID } from '../../EventSourcing/UUID'
import { DogMicrochippedEvent } from '../events/dogEvents';

// TODO: EITHER THIS DECORATOR...
@ChildEntity
export class Dog implements Entity {
  private isMicrochipped: boolean;
  private dogName: string;

  constructor(readonly id: UUID, readonly aggregate: ParentAggregate, dogName: string) {
    this.dogName = dogName
    this.isMicrochipped = false

    // OR THIS
    // this.aggregate.registerChildEntity(this)
  }

  @Emits(DogMicrochippedEvent)
  microchip() {
    this.isMicrochipped = true;
  }
}
