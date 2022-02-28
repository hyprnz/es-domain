import "reflect-metadata"
import { AbstractChangeEvent, EventConstructor } from "../personBoundedContext/events/personEvents";
import { Entity } from "./EventSourcingTypes";

/**
 * 
 * @param ChangeEvent Event emitted by this method, and reduced by this method on rehydration.
 *
 * Method can accept an object, which maps to the change data stored in the event.
 * However, the method may make state changes not tracked in the change object if they are
 * inherent to the event type:
 * 
 * @example
 * \@Emits(DogAdoptedEvent)
 * private adopt(data: { name: string }): void {
 *   // `data` contains info specific to this call
 *   this.name = data.name
 * 
 *   // state changes inherent to action/event type
 *   this.hasOwner = true
 * }
 */
export const Emits = <E extends AbstractChangeEvent>(ChangeEvent: EventConstructor<E>) => {
    type ApplyMethodDescriptor = 
        | TypedPropertyDescriptor<(change: E["delta"]) => void>
        | TypedPropertyDescriptor<() => void>;

    return (entity: Object, methodName: string, descriptor: ApplyMethodDescriptor) => {
        const originalMethod = descriptor.value;
        if (!originalMethod) throw new Error('State change method not implemented')

        Reflect.defineMetadata(
            `${ChangeEvent.eventType}Handler`,
            originalMethod,
            entity
        )
        descriptor.value = function (this: Entity, changeArg: E["delta"] = {}) {
            originalMethod.call(this, changeArg);
            this.aggregate.addChangeEvent(new ChangeEvent(this.aggregate.id(), this.id, changeArg));
        }
    }
}

export function ChildEntity<T extends { new(...args: any[]): Entity }>(BaseEntity: T) {
  return class extends BaseEntity {
    constructor(...args: any[]) {
      super(...args);
      this.aggregate.registerChildEntity(this)
    }
  };
}
