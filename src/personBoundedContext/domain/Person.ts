import { Parent } from '../../eventSourcing/Aggregate';
import { Emits } from '../../eventSourcing/decorators';
import { EventSourcedEntity } from '../../eventSourcing/Entity';
import { UUID } from '../../eventSourcing/UUID';
import { AdoptDogPayload, CreatePersonPayload, DogAdoptedEvent, PersonCreatedEvent } from '../events/personEvents'
import { Dog } from './Dog';

export class Person implements EventSourcedEntity {
  private name?: string;
  private isCool?: boolean;
  private dogs: Dog[] = [];

  constructor(readonly id: UUID, readonly aggregate: Parent) {
    aggregate.registerEntity(this)
  }

  create(firstName:string, lastName: string): Person {
    // validation/invariant checks
    if (!firstName.length || !lastName.length) throw new Error("Name must have at least one character!")
    if (this.name === 'Dora The Explorer') throw new Error("Don't change your name! It's awesome!")

    this.createPerson({
      name: firstName + " " + lastName
    })
    return this
  }

  findDog(dogId: UUID): Dog | undefined {
    return this.dogs.find(d => d.id === dogId)
  }

  @Emits(DogAdoptedEvent)
  adoptDog(dog: AdoptDogPayload): void {
    this.dogs.push(new Dog(dog.dogId, this.aggregate, dog.dogName));
  }

  @Emits(PersonCreatedEvent)
  private createPerson(payload: CreatePersonPayload): void {
    // state changes inherent to action/event type
    this.isCool = true

    // `payload` contains data specific to this call
    this.name = payload.name
  }
}