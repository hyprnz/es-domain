import * as Uuid from '../EventSourcing/UUID'
import { EntityEvent } from "../EventSourcing/EventSourcingTypes";
import { ReadModelMemoryRepository } from "../ReadModelRepository/ReadModelMemoryRepository";
import { WriteModelMemoryRepository } from "../WriteModelRepository/WriteModelMemoryRepository";
import { PersonService } from "./service/personService";

describe('personApplication', () => {
  // Setup Read Side
  const readModelRepo = new ReadModelMemoryRepository();
  const eventBus = (changes: Array<EntityEvent>) => {
    // const projections = []
    // projections.forEach(x => x(changes, readModelRepo))
  }

  // Setup Write side
  const personWriteRepository = new WriteModelMemoryRepository()
  personWriteRepository.subscribeToChanges(eventBus)
  const personService = new PersonService(personWriteRepository)

  it('Updates entities and read models', async () => {
    // Perform actions
    const person1Id = Uuid.createV4()

    await personService.onboardPerson(person1Id)

    readModelRepo.printAll()
  })

})