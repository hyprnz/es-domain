import { assertThat, match } from 'mismatched'
import { Parent } from './Aggregate'
import { EventSourcedAggregate } from './EventSourcedAggregate'
import { createV4, UUID } from '../UUID'
import { Device } from './deviceWithDecorators/domain/Device'
import { AlarmCreatedEvent } from './deviceWithDecorators/events/internal/AlarmCreatedEvent'

describe('EventSourcedAggregate', () => {
  const makeDevice = (id: UUID, aggregate: Parent) => new Device(id, aggregate)
  it('Can create a root entity', () => {
    const id = createV4()
    const alarmId = createV4()
    const deviceAggregate = new EventSourcedAggregate(id, makeDevice)

    deviceAggregate.rootEntity.addAlarm(alarmId)

    const uncommitted = deviceAggregate.uncommittedChanges()
    assertThat(uncommitted).is([
      {
        event: {
          ...AlarmCreatedEvent.make(
            createV4,
            {
              aggregateRootId: id,
              entityId: id,
              alarmId,
            }
          ),
          id: match.any(),
          correlationId: match.any(),
          causationId: match.any(),

          // Match dates approximately, exact match fails on build server
          dateTimeOfEvent: match.predicate( (date) =>  Math.abs(Date.now() - Date.parse(date)) < 1000  )
        },
        version: 0
      }
    ])
  })

  // xit('Can hydrate a root entity from events', () => {
  //   const id = createV4()
  //   const personCreatedEvent = new PersonCreatedEvent(id, id, {
  //     name: 'Rita Skeeter'
  //   })
  //   const events = [{ event: personCreatedEvent, version: 0 }]

  //   const personAggregate = new EventSourcedAggregate(id, makeDevice)
  //   personAggregate.loadFromHistory(events)

  //   // accessing private name property...
  //   // @ts-ignore
  //   assertThat(personAggregate.rootEntity.name).is('Rita Skeeter')

  //   const uncommited = personAggregate.uncommittedChanges()
  //   assertThat(uncommited).is([])
  // })

  // it('Can add and mutate a child entity', () => {
  //   const id = createV4()
  //   const dogId = createV4()

  //   const personAggregate = new EventSourcedAggregate(id, makeDevice)
  //   personAggregate.rootEntity.create('Peter', 'Parker')
  //   personAggregate.rootEntity.adoptDog({ dogId: dogId, dogName: 'Rudolf' })

  //   const rudolf = personAggregate.rootEntity.findDog(dogId)
  //   assertThat(rudolf).isNot(undefined)
  //   rudolf!.microchip()

  //   const uncommited = personAggregate.uncommittedChanges()
  //   assertThat(uncommited).is([
  //     {
  //       event: {
  //         ...new PersonCreatedEvent(id, id, { name: 'Peter Parker' }),
  //         id: match.any(),
  //         correlationId: match.any(),
  //         causationId: match.any(),
  //         dateTimeOfEvent: match.any()
  //       },
  //       version: 0
  //     },
  //     {
  //       event: {
  //         ...new DogAdoptedEvent(id, id, { dogId: dogId, dogName: 'Rudolf' }),
  //         id: match.any(),
  //         correlationId: match.any(),
  //         causationId: match.any(),
  //         dateTimeOfEvent: match.any()
  //       },
  //       version: 1
  //     },
  //     {
  //       event: {
  //         ...new DogMicroChippedEvent(id, dogId),
  //         id: match.any(),
  //         correlationId: match.any(),
  //         causationId: match.any(),
  //         dateTimeOfEvent: match.any()
  //       },
  //       version: 2
  //     }
  //   ])
  // })

  // xit('Can hydrate a child entity from events', () => {
  //   const id = createV4()
  //   const dogId = createV4()
  //   const personCreated = new PersonCreatedEvent(id, id, {
  //     name: 'Simone Biles'
  //   })
  //   const dogAdopted = new DogAdoptedEvent(id, id, { dogId, dogName: 'Rufus' })
  //   const dogMicroChipped = new DogMicroChippedEvent(id, dogId)
  //   const eventHistory = [
  //     { event: personCreated, version: 0 },
  //     { event: dogAdopted, version: 1 },
  //     { event: dogMicroChipped, version: 2 }
  //   ]

  //   const personAggregate = new EventSourcedAggregate(id, makeDevice)
  //   personAggregate.loadFromHistory(eventHistory)

  //   const rufus = personAggregate.rootEntity.findDog(dogId)

  //   // accessing private name property...
  //   // @ts-ignore
  //   assertThat(rufus.isMicrochipped).is(true)
  // })
})
