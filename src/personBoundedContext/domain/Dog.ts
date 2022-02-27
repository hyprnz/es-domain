import { Emits } from '../../EventSourcing/decorators'
import { ParentAggregate } from '../../EventSourcing/EventSourcingTypes'
import { UUID } from '../../EventSourcing/UUID'
import { DogMicrochippedEvent } from '../events/dogEvents';

export class Dog {
  private isMicrochipped: boolean;
  private dogName: string;

  constructor(
    readonly id: UUID,
    readonly aggregate: ParentAggregate,
    dogName: string
    ) {
      this.dogName = dogName
      this.isMicrochipped = false

      aggregate.registerAsChildEntity(this)
    }

  @Emits(DogMicrochippedEvent)
  microchip() {
    this.isMicrochipped = true;
  }
}
