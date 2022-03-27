import * as Uuid from "../../../../UUID";
import {ChangeEvent, EventData, ChangeEventFactory, baseChangeEventBuilder} from "../../../MessageTypes";

export interface AlarmDestroyedEvent extends ChangeEvent {
    eventType: 'AlarmDestroyedEvent'
    alarmId: Uuid.UUID
}

export interface AlarmDestroyedPayload {
    alarmId: Uuid.UUID
}

export namespace AlarmDestroyedEvent {
    export const eventType = 'AlarmDestroyedEvent'

    export const make: ChangeEventFactory<AlarmDestroyedEvent, AlarmDestroyedPayload> = (
        idProvider: () => Uuid.UUID,
        data: EventData & AlarmDestroyedPayload
    ): AlarmDestroyedEvent => ({
        ...baseChangeEventBuilder(idProvider, data),
        eventType,
        alarmId: data.alarmId
    })

    export const isAlarmDestroyedEvent = (e: ChangeEvent): e is AlarmDestroyedEvent => e.eventType === eventType

    export const assertAlarmDestroyedEvent = (e: ChangeEvent): asserts e is AlarmDestroyedEvent => {
        if (isAlarmDestroyedEvent(e)) return
        throw new Error(`Unexpected EventType, Expected EventType: ${eventType}, received ${e.eventType || typeof e}`)
    }
}