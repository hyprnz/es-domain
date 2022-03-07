import "reflect-metadata"
import { AbstractChangeEvent } from "..";
import { ChangeEventConstructor } from "./AbstractChangeEvent";
import { EventSourcedEntity } from "./Entity";

/**
 * 
 * @param ChangeEvent Event emitted by this method, and reduced by this method on rehydration.
 *
 * Method can accept an object, which maps to the payload stored in the event.
 * However, the method may make state changes not tracked in the payload if they are
 * inherent to the event type:
 * 
 * @example
 * \@Emits(DogAdoptedEvent)
 * private adopt(payload: { name: string }): void {
 *   // `payload` is the data specific to this call
 *   this.name = payload.name
 * 
 *   // state changes inherent to action/event type
 *   this.hasOwner = true
 * }
 */
export const Emits = <E extends AbstractChangeEvent>(ChangeEvent: ChangeEventConstructor<E>) => {
  type StateChangeMethodDescriptor = 
    | TypedPropertyDescriptor<(payload: E["payload"]) => void>
    | TypedPropertyDescriptor<() => void>;

    return (entity: Object, methodName: string, descriptor: StateChangeMethodDescriptor) => {
        const originalMethod = descriptor.value;
        if (!originalMethod) throw new Error('State change method not implemented')

        registerEventHandler(entity, ChangeEvent.eventType, originalMethod)

        descriptor.value = function (this: EventSourcedEntity, payload: E["payload"]) {
            originalMethod.call(this, payload);

            this.aggregate.addChangeEvent(new ChangeEvent(this.aggregate.id(), this.id, payload));
        }
    }
}

function registerEventHandler(entity: Object, eventType: string, handler: (() => void) | ((payload: Record<string, any>) => void)): void {
  Reflect.defineMetadata(`${eventType}Handler`, handler, entity)
}