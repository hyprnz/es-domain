import { Emits } from '../../EventSourcing/decorators'
import { ParentAggregate } from '../../EventSourcing/EventSourcingTypes'
import { UUID } from '../../EventSourcing/UUID'
import { DogMicrochippedEvent } from '../events/dogEvents';

export class Dog {
  private isMicrochipped = false;
  constructor(readonly id: UUID, private dogName: string, readonly aggregate: ParentAggregate) {}

  @Emits(DogMicrochippedEvent)
  microchip() {
    this.isMicrochipped = true;
  }
}
