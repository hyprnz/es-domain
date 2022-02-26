import { assertThat, match } from "mismatched"
import { Person } from "../personBoundedContext"
import { PersonCreatedEvent } from "../personBoundedContext/events/personEvents"
import { Aggregate } from "./Aggregate"
import { ParentAggregate } from "./EventSourcingTypes"
import { createV4, UUID } from "./UUID"

describe("Aggregate", () => {
    it("Can create a root entity", () => {
        // new Person aggregate
        const id = createV4()
        const createPerson = (id: UUID, aggregate: ParentAggregate) => {
            const person = new Person(id, aggregate)
            return person.create()
        }
        
        const personAggregate = new Aggregate(id, createPerson)
        const uncommited = personAggregate.uncommittedChanges()
        assertThat(uncommited).is([{
            event: {
                id: match.any(),
                entityId: id,
                aggregateRootId: id,
                eventType: PersonCreatedEvent.eventType,
            },
            version: match.not(match.number.nan())
        }])
    })
})