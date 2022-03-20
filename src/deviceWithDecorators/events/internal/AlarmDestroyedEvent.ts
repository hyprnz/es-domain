import * as Uuid from "../../../eventSourcing/UUID";
import {ChangeEvent} from "../../../eventSourcing/MessageTypes";

export interface AlarmDestroyedEvent extends ChangeEvent {
    eventType: 'AlarmDestroyedEvent'
}

export namespace AlarmDestroyedEvent {
    export const eventType = 'AlarmDestroyedEvent'

    export const make = (
        idProvider: () => Uuid.UUID,
        data: {
            alarmId: Uuid.UUID
            deviceId: Uuid.UUID
            correlationId?: Uuid.UUID
            causationId?: Uuid.UUID
        }
    ): AlarmDestroyedEvent => ({
        id: idProvider(),
        correlationId: data.correlationId ?? idProvider(),
        causationId: data.causationId ?? idProvider(),
        eventType,
        aggregateRootId: data.deviceId,
        entityId: data.alarmId,
        dateTimeOfEvent: new Date().toISOString() // TODO: add opaque date type
    })

    export const isAlarmDestroyedEvent = (e: ChangeEvent): e is AlarmDestroyedEvent => e.eventType === eventType

    export const assertAlarmDestroyedEvent = (e: ChangeEvent): asserts e is AlarmDestroyedEvent => {
        if (isAlarmDestroyedEvent(e)) return
        throw new Error(`Unexpected EventType, Expected EventType: ${eventType}, received ${e.eventType || typeof e}`)
    }
}