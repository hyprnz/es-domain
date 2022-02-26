import { Person } from "..";
import { Aggregate } from "../../EventSourcing/Aggregate";
import * as Uuid from "../../EventSourcing/UUID";
import { WriteModelRepository } from "../../WriteModelRepository/WriteModelRepositoryTypes";

export class PersonService {
  constructor(private writeRepo: WriteModelRepository) { }

  private static makePersonAggregate = (personId: Uuid.UUID)=> new Aggregate<Person>(      
    // TODO: come back to the concept of parent
    personId, 
    (id, parent) => new Person(id, parent),
  )

  async onboardPerson(personId: Uuid.UUID): Promise<void> {
    const personAggregate = PersonService.makePersonAggregate(personId)
    await this.writeRepo.save(personAggregate)
  }
}