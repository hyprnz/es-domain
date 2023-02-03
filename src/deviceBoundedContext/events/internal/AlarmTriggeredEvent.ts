import {ChangeEvent} from "../../../eventSourcing/contracts/MessageTypes";
import * as Uuid from "../../../util/UUID";

export interface AlarmTriggeredEvent extends ChangeEvent {
    eventType: 'AlarmTriggeredEvent'
}

export namespace AlarmTriggeredEvent {
    export const eventType = 'AlarmTriggeredEvent'

    export const make = (
        idProvider: () => Uuid.UUID,
        data: {
            alarmId: Uuid.UUID
            deviceId: Uuid.UUID
            correlationId?: Uuid.UUID
            causationId?: Uuid.UUID
        }
    ): AlarmTriggeredEvent => ({
        id: idProvider(),
        correlationId: data.correlationId,
        causationId: data.causationId,
        eventType,
        aggregateRootId: data.deviceId,
        entityId: data.alarmId,
        dateTimeOfEvent: new Date().toISOString() // TODO: add opaque date type
    })

    export const isAlarmTriggeredEvent = (e: ChangeEvent): e is AlarmTriggeredEvent => e.eventType === eventType

    export const assertAlarmTriggeredEvent = (e: ChangeEvent): asserts e is AlarmTriggeredEvent => {
        if (isAlarmTriggeredEvent(e)) return
        throw new Error(`Unexpected EventType, Expected EventType: AlarmTriggeredEvent, received ${typeof e}`)
    }
}