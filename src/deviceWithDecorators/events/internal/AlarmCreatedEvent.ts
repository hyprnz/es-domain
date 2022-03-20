import * as Uuid from "../../../eventSourcing/UUID";
import {ChangeEvent, EventData, EventFactory} from "../../../eventSourcing/MessageTypes";

export interface AlarmCreatedEvent extends ChangeEvent {
    eventType: 'AlarmCreatedEvent'
    alarmId: Uuid.UUID
}

export interface AlarmCreatedPayload {
    alarmId: Uuid.UUID
}

// export namespace AlarmCreated {
//     export const eventType = 'AlarmCreatedEvent'

//     export const make: EventFactory<AlarmCreatedEvent, AlarmCreatedPayload> = (
//         idProvider: () => Uuid.UUID,
//         data: {
//             entityId: Uuid.UUID
//             aggregateRootId: Uuid.UUID
//             correlationId?: Uuid.UUID
//             causationId?: Uuid.UUID
//             alarmId: Uuid.UUID
//         }
//     ): AlarmCreatedEvent => ({
//         id: idProvider(),
//         correlationId: data.correlationId ?? idProvider(),
//         causationId: data.causationId ?? idProvider(),
//         eventType,
//         aggregateRootId: data.aggregateRootId,
//         entityId: data.entityId,
//         dateTimeOfEvent: new Date().toISOString(), // TODO: add opaque date type
//         alarmId: data.alarmId
//     })

//     export const event = { make, eventType }

//     export const isAlarmCreatedEvent = (e: ChangeEvent): e is AlarmCreatedEvent => e.eventType === eventType

//     export function assertAlarmCreatedEvent(e: ChangeEvent): asserts e is AlarmCreatedEvent {
//         if (isAlarmCreatedEvent(e)) return
//         throw new Error(`Unexpected EventType, Expected EventType: ${eventType}, received ${e.eventType || typeof e}`)
//     }
// }

export type InternalEventCtr<T extends ChangeEvent, D = {}> = {
  new (): InternalEvent<T, D> 
}
export interface InternalEvent<T extends ChangeEvent, D = {}> {
    eventType: string;
    makeEvent: EventFactory<T, D>
}

export class AlarmCreated implements InternalEvent<AlarmCreatedEvent, AlarmCreatedPayload> {
    private static readonly _eventType = 'AlarmCreatedEvent'
    readonly eventType = AlarmCreated._eventType

    makeEvent (
        idProvider: () => Uuid.UUID,
        data: EventData & AlarmCreatedPayload
    ): AlarmCreatedEvent {
        return {
        id: idProvider(),
        correlationId: data.correlationId ?? idProvider(),
        causationId: data.causationId ?? idProvider(),
        eventType: this.eventType,
        aggregateRootId: data.aggregateRootId,
        entityId: data.entityId,
        dateTimeOfEvent: new Date().toISOString(), // TODO: add opaque date type
        alarmId: data.alarmId
      }
    }

    static isAlarmCreatedEvent (e: ChangeEvent): e is AlarmCreatedEvent {
      return e.eventType === AlarmCreated._eventType
    }

    static assertAlarmCreatedEvent(e: ChangeEvent): asserts e is AlarmCreatedEvent {
        if (this.isAlarmCreatedEvent(e)) return
        throw new Error(`Unexpected EventType, Expected EventType: ${AlarmCreated._eventType}, received ${e.eventType || typeof e}`)
    }
}