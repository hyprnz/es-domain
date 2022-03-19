import { Person } from '..'
import { Uuid, WriteModelRepository } from '../..'
import { EventSourcedAggregate } from '../../eventSourcing/EventSourcedAggregate'

export class PersonService {
  constructor(private writeRepo: WriteModelRepository) {}

  private static makePersonAggregate = (personId: Uuid.UUID) => new EventSourcedAggregate(personId, (id, parent) => new Person(id, parent))

  async onboardPerson(personId: Uuid.UUID): Promise<void> {
    const personAggregate = PersonService.makePersonAggregate(personId)
    personAggregate.rootEntity.create('Laché', 'Melvin')
    await this.writeRepo.save(personAggregate)
  }

  async adoptDog(personId: Uuid.UUID, dogId: Uuid.UUID, dogName: string): Promise<void> {
    // const personAggregate = await this.writeRepo.load(personId, new EventSourcedAggregate())
    // personAggregate.rootEntity.adoptDog({ dogId, dogName })
    // await this.writeRepo.save(personAggregate)
  }

  async microchipDog(personId: Uuid.UUID, dogId: Uuid.UUID): Promise<void> {
    // const personAggregate = await this.writeRepo.load(personId, PersonService.makePersonAggregate)
    // const dog = personAggregate.rootEntity.findDog(dogId)
    // if (dog) dog.microchip()
    // await this.writeRepo.save(personAggregate)
  }
}
