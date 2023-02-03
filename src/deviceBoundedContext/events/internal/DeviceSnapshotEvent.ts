import * as Uuid from "../../../util/UUID";
import {ChangeEvent} from "../../../eventSourcing/contracts/MessageTypes";
import {DeviceCreatedEvent} from "./DeviceCreatedEvent";

export interface DeviceSnapshotEvent extends ChangeEvent {
    eventType: 'DeviceSnapshotEvent',
    colour: string,
}

export namespace DeviceSnapshotEvent {
    export const eventType = 'DeviceSnapshotEvent'

    export const make = (
        idProvider: () => Uuid.UUID,
        data: {
            deviceId: Uuid.UUID
            dateTimeOfEvent: string,
            colour: string
            correlationId?: Uuid.UUID
            causationId?: Uuid.UUID,

        }
    ): DeviceSnapshotEvent => ({
        id: idProvider(),
        correlationId: data.correlationId,
        causationId: data.causationId,
        eventType: eventType,
        aggregateRootId: data.deviceId,
        entityId: data.deviceId,
        dateTimeOfEvent: data.dateTimeOfEvent,
        colour: data.colour
    })

    export const isDeviceSnapshotEvent = (e: ChangeEvent): e is DeviceSnapshotEvent => e.eventType === eventType
    export function assertIsDeviceSnapshotEvent(e: ChangeEvent): asserts e is DeviceSnapshotEvent {
        if (isDeviceSnapshotEvent(e)) return
        throw new Error(`Unexpected EventType, Expected EventType: DeviceCreatedEvent, received ${e.eventType}`)
    }
}