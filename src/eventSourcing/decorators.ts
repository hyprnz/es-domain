import 'reflect-metadata'
import { AbstractChangeEvent, ChangeEventConstructor } from './AbstractChangeEvent'
import { ChangeEvent, EventFactory, Uuid } from "..";
import { EventSourcedEntity } from "./Entity";
import { InternalEventCtr } from '../deviceWithDecorators/events/internal/AlarmCreatedEvent';

/** Registers an entity with its aggregate for event handler management */
export function Entity<T extends { new(...args: any[]): EventSourcedEntity }>(BaseEntity: T) {
  return class extends BaseEntity {
    constructor(...args: any[]) {
      super(...args);
      this.aggregate.registerEntity(this)
    }
  };
}

/**
 * 
 * @param eventFactory Factory for the event emitted by this method, and reduced by this method on rehydration.
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
export const Emits = <T extends ChangeEvent, D = {}>(EventBuilder: InternalEventCtr<T, D>) => {
  type StateChangeMethodDescriptor = 
    | TypedPropertyDescriptor<(data: D) => void>
    | TypedPropertyDescriptor<() => void>

  const eventBuilder = new EventBuilder()

  function registerEventHandler(entity: Object, handler: (() => void) | ((payload: D) => void)): void {
    Reflect.defineMetadata(`${eventBuilder.eventType}Handler`, handler, entity)
  }

  return (entity: Object, methodName: string, descriptor: StateChangeMethodDescriptor) => {
    const originalMethod = descriptor.value
    if (!originalMethod) throw new Error('State change method not implemented')

    registerEventHandler(entity, originalMethod)

    descriptor.value = function (this: EventSourcedEntity, data: D) {
      originalMethod.call(this, data)
      this.aggregate.addChangeEvent(eventBuilder.makeEvent(
        Uuid.createV4,
        {
          entityId: this.id,
          aggregateRootId: this.aggregate.id(),
          correlationId: this.aggregate.correlationId(),
          causationId: this.aggregate.causationId(),
          ...data
        }
      ))
    }
  }
}
// export const Emits = <E extends ChangeEvent, D = {}>(event: { eventType: string, make: EventFactory<E, D> }) => {
//   type StateChangeMethodDescriptor = 
//     | TypedPropertyDescriptor<(data: D) => void>
//     | TypedPropertyDescriptor<() => void>

//   function registerEventHandler(entity: Object, handler: (() => void) | ((payload: D) => void)): void {
//     Reflect.defineMetadata(`${event.eventType}Handler`, handler, entity)
//   }

//   return (entity: Object, methodName: string, descriptor: StateChangeMethodDescriptor) => {
//     const originalMethod = descriptor.value
//     if (!originalMethod) throw new Error('State change method not implemented')

//     registerEventHandler(entity, originalMethod)

//     descriptor.value = function (this: EventSourcedEntity, data: D) {
//       originalMethod.call(this, data)
//       this.aggregate.addChangeEvent(event.make(
//         Uuid.createV4,
//         {
//           entityId: this.id,
//           aggregateRootId: this.aggregate.id(),
//           correlationId: this.aggregate.correlationId(),
//           causationId: this.aggregate.causationId(),
//           ...data
//         }
//       ))
//     }
//   }
// }
