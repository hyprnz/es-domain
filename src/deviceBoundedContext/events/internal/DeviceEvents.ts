import { ChangeEvent } from '../../../eventSourcing/MessageTypes'
import * as Uuid from '../../../eventSourcing/UUID'

export class DeviceDomainError extends Error {
  constructor(public readonly aggregateRootId: Uuid.UUID, message: string) {
    super(message)
  }
}

export interface DeviceCreatedEvent extends ChangeEvent {
  eventType: 'DeviceCreatedEvent'
}

export namespace DeviceCreatedEvent {
  export const eventType = 'DeviceCreatedEvent'

  export const make = (
    idProvider: () => Uuid.UUID,
    data: {
      deviceId: Uuid.UUID
      correlationId?: Uuid.UUID
      causationId?: Uuid.UUID
    }
  ): DeviceCreatedEvent => ({
    id: idProvider(),
    correlationId: data.correlationId ?? idProvider(),
    causationId: data.causationId ?? idProvider(),
    eventType,
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
