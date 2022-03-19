import { EntityEvent, Uuid } from '..'
import { ReadModelMemoryRepository } from '../readModelRepository/ReadModelMemoryRepository'
import { AggregateRepository } from '../writeModelRepository/AggregateRepository'
import { InMemoryEventStoreRepository } from '../writeModelRepository/InMemoryEventStoreRepository'
import { PersonService } from './service/personService'

describe('personApplication', () => {
  // Setup Read Side
  const readModelRepo = new ReadModelMemoryRepository()
  const handler = async (changes: Array<EntityEvent>) => {
    // const projections = []
    // projections.forEach(x => x(changes, readModelRepo))
  }

  // Setup Write side
  const personWriteRepository = new AggregateRepository(new InMemoryEventStoreRepository())
  personWriteRepository.subscribeToChangesSynchronously(handler)
  const personService = new PersonService(personWriteRepository)

  it('Updates entities and read models', async () => {
    // Perform actions
    const person1Id = Uuid.createV4()
    const dogId = Uuid.createV4()

    await personService.onboardPerson(person1Id)
    await personService.adoptDog(person1Id, dogId, 'Rufus')
    await personService.microchipDog(person1Id, dogId)

    readModelRepo.printAll()
  })
})
