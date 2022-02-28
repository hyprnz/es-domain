import { Emits } from '../../EventSourcing/decorators'
import { Entity, ParentAggregate } from '../../EventSourcing/EventSourcingTypes'
import { UUID } from '../../EventSourcing/UUID'
import { DogAdoptedEvent, PersonCreatedEvent } from '../events/personEvents'
import { Dog } from './Dog';

export class Person implements Entity {
  private name?: string;
  private isCool?: boolean;
  private dogs: Dog[];
  constructor(readonly id: UUID, readonly aggregate: ParentAggregate) {
    this.dogs = [];
  }

  create(firstName:string, lastName = "Smith"): Person {
    if (!firstName.length) throw new Error("Name must have at least one character!")
    this.applyCreate({
      name: firstName + " " + lastName
    })
    return this
  }

  findDog(dogId: UUID): Dog | undefined {
    return this.dogs.find(d => d.id === dogId)
  }

  @Emits(PersonCreatedEvent)
  private applyCreate(data: { name: string }): void {
    // state changes inherent to action/event type
    this.isCool = true

    // `data` contains data specific to this call
    this.name = data.name
  }

  @Emits(DogAdoptedEvent)
  adoptDog(dog: {dogId: UUID, dogName: string}): void {
    this.dogs.push(new Dog(dog.dogId, this.aggregate, dog.dogName));
  }
}