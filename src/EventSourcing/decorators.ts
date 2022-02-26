import { AbstractChangeEvent } from "../personBoundedContext/events/personEvents";
import { Aggregate } from "./Aggregate";
import { ParentAggregate } from "./EventSourcingTypes";
import { UUID } from "./UUID";

interface DomainObject {
    id: UUID,
    aggregate: ParentAggregate
}

type EventConstructor<E extends AbstractChangeEvent> = { new (aggregateRootId: UUID, entityId: UUID): E }

export const Emits = <E extends AbstractChangeEvent>(Event: EventConstructor<E>) => {
    return (target: any, methodName: string, descriptor: PropertyDescriptor) => {
        const originalMethod = descriptor.value;
        descriptor.value = function (this: DomainObject, ...args:any[]) {
            originalMethod.apply(this, args);
            const aggregate = this.aggregate;
            aggregate.addChangeEvent(new Event(aggregate.id(), this.id));
        }

    }
}