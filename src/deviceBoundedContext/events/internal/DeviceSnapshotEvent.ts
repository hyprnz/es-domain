import * as Uuid from "../../../eventSourcing/UUID";
import {ChangeEvent} from "../../../eventSourcing/MessageTypes";
import {DeviceCreatedEvent} from "./DeviceCreatedEvent";

export interface DeviceSnapshotEvent extends ChangeEvent {
    eventType: 'DeviceSnapshotEvent'
}

export namespace DeviceSnapshotEvent {
    export const eventType = 'DeviceSnapshotEvent'

    export const make = (
        idProvider: () => Uuid.UUID,
        data: {
            deviceId: Uuid.UUID
            dateTimeOfEvent: string
            correlationId?: Uuid.UUID
            causationId?: Uuid.UUID
        }
    ): DeviceSnapshotEvent => ({
        id: idProvider(),
        correlationId: data.correlationId ?? idProvider(),
        causationId: data.causationId ?? idProvider(),
        eventType: eventType,
        aggregateRootId: data.deviceId,
        entityId: data.deviceId,
        dateTimeOfEvent: new Date().toISOString() // TODO: add opaque date type
    })

    export const isDeviceCreatedEvent = (e: ChangeEvent): e is DeviceCreatedEvent => e.eventType === eventType
    export const assertDeviceCreatedEvent = (e: ChangeEvent): asserts e is DeviceCreatedEvent => {
        if (isDeviceCreatedEvent(e)) return
        throw new Error(`Unexpected EventType, Expected EventType: DeviceCreatedEvent, received ${typeof e}`)
    }
}