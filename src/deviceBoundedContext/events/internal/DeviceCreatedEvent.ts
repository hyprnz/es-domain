import { ChangeEvent } from '../../../eventSourcing/MessageTypes'
import * as Uuid from '../../../eventSourcing/UUID'

export interface DeviceCreatedEvent extends ChangeEvent {
  eventType: 'DeviceCreatedEvent'
  colour: string
}

export namespace DeviceCreatedEvent {
  export const eventType = 'DeviceCreatedEvent'

  export const make = (
    idProvider: () => Uuid.UUID,
    data: {
      deviceId: Uuid.UUID
      colour: string,
      correlationId?: Uuid.UUID
      causationId?: Uuid.UUID,
    }
  ): DeviceCreatedEvent => ({
    id: idProvider(),
    correlationId: data.correlationId,
    causationId: data.causationId,
    eventType,
    aggregateRootId: data.deviceId,
    entityId: data.deviceId,
    dateTimeOfEvent: new Date().toISOString(), // TODO: add opaque date type
    colour: data.colour,
  })

  export const isDeviceCreatedEvent = (e: ChangeEvent): e is DeviceCreatedEvent => e.eventType === eventType
  export function assertIsDeviceCreatedEvent(e: ChangeEvent): asserts e is DeviceCreatedEvent {
    if (isDeviceCreatedEvent(e)) return
    throw new Error(`Unexpected EventType, Expected EventType: DeviceCreatedEvent, received ${e.eventType}`)
  }
}
