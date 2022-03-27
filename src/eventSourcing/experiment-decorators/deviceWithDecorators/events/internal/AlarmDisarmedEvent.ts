import {baseChangeEventBuilder, ChangeEvent, ChangeEventFactory, EventData} from "../../../MessageTypes";
import * as Uuid from "../../../../UUID";

export interface AlarmDisarmedEvent extends ChangeEvent {
    eventType: 'AlarmDisarmedEvent'
}

export namespace AlarmDisarmedEvent {
    export const eventType = 'AlarmDisarmedEvent'

    export const make: ChangeEventFactory<AlarmDisarmedEvent> = (
        idProvider: () => Uuid.UUID,
        data: EventData
    ): AlarmDisarmedEvent => ({
        ...baseChangeEventBuilder(idProvider, data),
        eventType,
    })

    export const isAlarmDisarmedEvent = (e: ChangeEvent): e is AlarmDisarmedEvent => e.eventType === eventType

    export function assertAlarmDisarmedEvent(e: ChangeEvent): asserts e is AlarmDisarmedEvent {
        if (isAlarmDisarmedEvent(e)) return
        throw new Error(`Unexpected EventType, Expected EventType: ${eventType}, received ${e.eventType || typeof e}`)
    }
}