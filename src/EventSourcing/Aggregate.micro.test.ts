import { assertThat, match } from "mismatched"
import { Person } from "../personBoundedContext"
import { DogMicrochippedEvent } from "../personBoundedContext/events/dogEvents"
import { DogAdoptedEvent, PersonCreatedEvent } from "../personBoundedContext/events/personEvents"
import { Aggregate } from "./Aggregate"
import { ParentAggregate } from "./EventSourcingTypes"
import { createV4, UUID } from "./UUID"

describe("Aggregate", () => {
    const makePerson = (id: UUID, aggregate: ParentAggregate) => new Person(id, aggregate);
    it("Can create a root entity", () => {
        const id = createV4()
        const personAggregate = new Aggregate(id, makePerson)

        personAggregate.rootEntity.create("Susan");

        const uncommited = personAggregate.uncommittedChanges()
        assertThat(uncommited).is([{
            event: {
                id: match.any(),
                entityId: id,
                aggregateRootId: id,
                eventType: PersonCreatedEvent.eventType,
                delta: {
                    name: "Susan Smith"
                }
            },
            version: match.not(match.number.nan())
        }])
    })

    it("Can hydrate a root entity from events", () => {
        const id = createV4()
        const personCreatedEvent = new PersonCreatedEvent(id, id, {name: "Susan"});
        const events = [{event: personCreatedEvent, version: 0}];

        const personAggregate = new Aggregate(id, makePerson)
        personAggregate.loadFromHistory(events);

        // accessing private name property...
        // @ts-ignore
        assertThat(personAggregate.rootEntity.name).is("Susan");

        const uncommited = personAggregate.uncommittedChanges()
        assertThat(uncommited).is([])
    })

    it("Can add and mutate a child entity", () => {
        const id = createV4()
        const dogId = createV4()

        const personAggregate = new Aggregate(id, makePerson)
        personAggregate.rootEntity.create("Susan");
        personAggregate.rootEntity.adoptDog({dogId: dogId, dogName: "Rudolf"})

        const rudolf = personAggregate.rootEntity.findDog(dogId);
        assertThat(rudolf).isNot(undefined);
        rudolf!.microchip();

        const uncommited = personAggregate.uncommittedChanges()
        assertThat(uncommited[1].event.eventType).is(DogAdoptedEvent.eventType)
        assertThat(uncommited[2].event.eventType).is(DogMicrochippedEvent.eventType)
    })

    it("Can hydrate a child entity from events", () => {
        const id = createV4()
        const dogId = createV4()
        const personCreated = new PersonCreatedEvent(id, id, { name: "Simone" });
        const dogAdopted = new DogAdoptedEvent(id, id, { dogId, dogName: "Rufus" });
        const dogMicrochipped = new DogMicrochippedEvent(id, dogId);
        const eventHistory = [
            { event: personCreated, version: 0 },
            { event: dogAdopted, version: 1 },
            { event: dogMicrochipped, version: 2 }
            ];
        
        const personAggregate = new Aggregate(id, makePerson)
        personAggregate.loadFromHistory(eventHistory)

        const rufus = personAggregate.rootEntity.findDog(dogId)

        // accessing private name property...
        // @ts-ignore
        assertThat(rufus.isMicrochipped).is(true);
    })
})