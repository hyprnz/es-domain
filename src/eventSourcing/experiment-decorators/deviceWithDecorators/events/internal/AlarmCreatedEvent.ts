import * as Uuid from "../../../../UUID";
import {ChangeEvent, EventData, ChangeEventFactory, baseChangeEventBuilder} from "../../../MessageTypes";

export interface AlarmCreatedEvent extends ChangeEvent {
    eventType: 'AlarmCreatedEvent'
    alarmId: Uuid.UUID
}

export interface AlarmCreatedPayload {
    alarmId: Uuid.UUID
}

export namespace AlarmCreatedEvent {
    export const eventType = 'AlarmCreatedEvent'

    export const make: ChangeEventFactory<AlarmCreatedEvent, AlarmCreatedPayload> = (
        idProvider: () => Uuid.UUID,
        // TODO: discussion: is the entityId the deviceId or the alarmId?
        // in this case, event is emitted from the device, so entityId is device ID...
        data: EventData & AlarmCreatedPayload
    ): AlarmCreatedEvent => ({
        ...baseChangeEventBuilder(idProvider, data),
        eventType,
        alarmId: data.alarmId
    })

    export const isAlarmCreatedEvent = (e: ChangeEvent): e is AlarmCreatedEvent => e.eventType === eventType

    export function assertAlarmCreatedEvent(e: ChangeEvent): asserts e is AlarmCreatedEvent {
        if (isAlarmCreatedEvent(e)) return
        throw new Error(`Unexpected EventType, Expected EventType: ${eventType}, received ${e.eventType || typeof e}`)
    }
}
