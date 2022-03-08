import { Parent } from '../../eventSourcing/Aggregate'
import { Emits, Entity } from '../../eventSourcing/decorators';
import { EventSourcedEntity } from '../../eventSourcing/Entity'
import { UUID } from '../../eventSourcing/UUID'
import { DogMicroChippedEvent } from '../events/dogEvents'

@Entity
export class Dog implements EventSourcedEntity {
  private isMicrochipped: boolean
  private dogName: string

  constructor(readonly id: UUID, readonly aggregate: Parent, dogName: string) {
    this.dogName = dogName
    this.isMicrochipped = false
  }

  @Emits(DogMicroChippedEvent)
  microchip() {
    this.isMicrochipped = true
  }
}
