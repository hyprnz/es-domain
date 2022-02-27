import "reflect-metadata"
import { AbstractChangeEvent, EventConstructor } from "../personBoundedContext/events/personEvents";
import { ParentAggregate } from "./EventSourcingTypes";
import { UUID } from "./UUID";

interface DomainObject {
    id: UUID,
    aggregate: ParentAggregate
}

/**
 * 
 * @param ChangeEvent Event emitted by this method, and reduced by this method on rehydration.
 *
 * Method can accept a change object, which maps to the change data stored in the event.
 * However, the method may make state changes not tracked in the change object if they are
 * inherent to the event type:
 * 
 * @example
 * \@Emits(DogAdoptedEvent)
 * private adopt(change: { name: string }): void {
 *   // state changes inherent to action/event type
 *   this.hasOwner = true
 *  
 *   // `change` contains data specific to this call...
 *   this.name = change.name
 * }
 */
export const Emits = <E extends AbstractChangeEvent>(ChangeEvent: EventConstructor<E>) => {
    type ApplyMethodDescriptor = 
        | TypedPropertyDescriptor<(change: E["delta"]) => void>
        | TypedPropertyDescriptor<() => void>;

    return (entity: DomainObject, methodName: string, descriptor: ApplyMethodDescriptor) => {
        const originalMethod = descriptor.value;
        if (!originalMethod) throw new Error('State change method not implemented')

        Reflect.defineMetadata(
            ChangeEvent.eventType,
            originalMethod.bind(entity),
            entity
        )
        descriptor.value = function (this: DomainObject, changeArg: E["delta"] = {}) {
            originalMethod.call(this, changeArg);
            this.aggregate.addChangeEvent(new ChangeEvent(this.aggregate.id(), this.id, changeArg));
        }
    }
}
