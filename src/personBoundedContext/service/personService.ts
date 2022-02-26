import { Person } from "..";
import { AggregateContainer } from "../../EventSourcing/AggregateRoot";
import * as Uuid from "../../EventSourcing/UUID";
import { WriteModelRepository } from "../../WriteModelRepository/WriteModelRepositoryTypes";

export class PersonService {
  constructor(private writeRepo: WriteModelRepository) { }

  private static makePersonAggregate = (personId: Uuid.UUID)=> new AggregateContainer<Person>(      
    (p, id) => new Person(p, id),
    personId, 
  )

  async onboardPerson(personId: Uuid.UUID): Promise<void> {
    const aggregate = PersonService.makePersonAggregate(personId) 
    await this.writeRepo.save(aggregate)        
  }
}