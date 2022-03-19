import * as Uuid from "../../../eventSourcing/UUID";
import {ChangeEvent} from "../../../eventSourcing/MessageTypes";

export interface AlarmCreatedEvent extends ChangeEvent {
    eventType: 'AlarmCreatedEvent'
}

export namespace AlarmCreatedEvent {
    export const eventType = 'AlarmCreatedEvent'

    export const make = (
        idProvider: () => Uuid.UUID,
        data: {
            alarmId: Uuid.UUID
            deviceId: Uuid.UUID
            correlationId?: Uuid.UUID
            causationId?: Uuid.UUID
        }
    ): AlarmCreatedEvent => ({
        id: idProvider(),
        correlationId: data.correlationId ?? idProvider(),
        causationId: data.causationId ?? idProvider(),
        eventType,
        aggregateRootId: data.deviceId,
        entityId: data.alarmId,
        dateTimeOfEvent: new Date().toISOString() // TODO: add opaque date type
    })

    export const isAlarmCreatedEvent = (e: ChangeEvent): e is AlarmCreatedEvent => e.eventType === eventType

    export function assertAlarmCreatedEvent(e: ChangeEvent): asserts e is AlarmCreatedEvent {
        if (isAlarmCreatedEvent(e)) return
        throw new Error(`Unexpected EventType, Expected EventType: AlarmCreatedEvent, received ${typeof e}`)
    }
}