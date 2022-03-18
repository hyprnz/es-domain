import { ChangeEvent } from "../../../eventSourcing/MessageTypes";
import * as Uuid from "../../../eventSourcing/UUID";

export class DeviceDomainError  extends Error {
  constructor(public readonly aggregateRootId: Uuid.UUID, message:string){
    super(message)
  }
}

export interface DeviceCreatedEvent extends ChangeEvent {
  eventType: "DeviceCreatedEvent"
}

export namespace DeviceCreatedEvent {

  export const eventType = 'DeviceCreatedEvent'

  export const make = (
    idProvider: () => Uuid.UUID,
    data: {
      deviceId: Uuid.UUID
      correlationId?: Uuid.UUID
      causationId?: Uuid.UUID
    },
  ): DeviceCreatedEvent => ({
    id: idProvider(),
    correlationId: data.correlationId ?? idProvider(),
    causationId: data.causationId ?? idProvider(),
    eventType,
    aggregateRootId: data.deviceId,
    entityId: data.deviceId,
    dateTimeOfEvent: new Date().toISOString(), // TODO: add opaque date type
  })

  export const isDeviceCreatedEvent = (e: ChangeEvent): e is DeviceCreatedEvent => e.eventType === eventType
  export function assertDeviceCreatedEvent(e: ChangeEvent): asserts e is DeviceCreatedEvent {
    if (isDeviceCreatedEvent(e)) return
    throw new Error(`Unexpected EventType, Expected EventType: DeviceCreatedEvent, received ${typeof e}` )
  }
}


export interface AlarmCreatedEvent extends ChangeEvent {
  eventType: "AlarmCreatedEvent"
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
    },
  ): AlarmCreatedEvent => ({
    id: idProvider(),
    correlationId: data.correlationId ?? idProvider(),
    causationId: data.causationId ?? idProvider(),
    eventType,
    aggregateRootId: data.deviceId,
    entityId: data.alarmId,
    dateTimeOfEvent: new Date().toISOString(), // TODO: add opaque date type
      
  })

  export const isAlarmCreatedEvent = (e: ChangeEvent): e is AlarmCreatedEvent => e.eventType === eventType
  export function assertAlarmCreatedEvent(e: ChangeEvent): asserts e is AlarmCreatedEvent {
    if (isAlarmCreatedEvent(e)) return
    throw new Error(`Unexpected EventType, Expected EventType: AlarmCreatedEvent, received ${typeof e}` )
  }
}

export interface AlarmArmedEvent extends ChangeEvent {
  eventType: "AlarmArmedEvent"
  threshold: number
}

export namespace AlarmArmedEvent {

  export const eventType = 'AlarmArmedEvent'

  export const make = (
    idProvider: () => Uuid.UUID,
    data: {
      alarmId: Uuid.UUID
      deviceId: Uuid.UUID
      threshold: number
      correlationId?: Uuid.UUID
      causationId?: Uuid.UUID
    },
  ): AlarmArmedEvent => ({
    id: idProvider(),
    correlationId: data.correlationId ?? idProvider(),
    causationId: data.causationId ?? idProvider(),
    eventType,
    aggregateRootId: data.deviceId,
    entityId: data.alarmId,
    threshold: data.threshold,
    dateTimeOfEvent: new Date().toISOString(), // TODO: add opaque date type
  })

  export const isAlarmArmedEvent = (e: ChangeEvent): e is AlarmArmedEvent => e.eventType === eventType
  export function assertAlarmArmedEvent(e: ChangeEvent): asserts e is AlarmArmedEvent {
    if (e.eventType === eventType) return
    throw new Error(`Unexpected EventType, Expected EventType: AlarmArmedEvent, received ${typeof e}` )
  }
}


export interface AlarmDisarmedEvent extends ChangeEvent {
  eventType: "AlarmDisarmedEvent"
}

export namespace AlarmDisarmedEvent {

  export const eventType = 'AlarmDisarmedEvent'

  export const make = (
    idProvider: () => Uuid.UUID,
    data: {
      alarmId: Uuid.UUID
      deviceId: Uuid.UUID
      correlationId?: Uuid.UUID
      causationId?: Uuid.UUID
    },
  ): AlarmDisarmedEvent => ({
    id: idProvider(),
    correlationId: data.correlationId ?? idProvider(),
    causationId: data.causationId ?? idProvider(),
    eventType,
    aggregateRootId: data.deviceId,
    entityId: data.alarmId,
    dateTimeOfEvent: new Date().toISOString(), // TODO: add opaque date type
  })

  export const isAlarmDisarmedEvent = (e: ChangeEvent): e is AlarmDisarmedEvent => e.eventType === eventType
  export function assertAlarmDisarmedEvent(e: ChangeEvent): asserts e is AlarmDisarmedEvent {
    if (isAlarmDisarmedEvent(e)) return
    throw new Error(`Unexpected EventType, Expected EventType: AlarmDisarmedEvent, received ${typeof e}` )
  }
}


export interface AlarmTriggeredEvent extends ChangeEvent {
  eventType: "AlarmTriggeredEvent"
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
    },
  ): AlarmTriggeredEvent => ({
    id: idProvider(),
    correlationId: data.correlationId ?? idProvider(),
    causationId: data.causationId ?? idProvider(),
    eventType,
    aggregateRootId: data.deviceId,
    entityId: data.alarmId,
    dateTimeOfEvent: new Date().toISOString(), // TODO: add opaque date type
  })

  export const isAlarmTriggeredEvent = (e: ChangeEvent): e is AlarmTriggeredEvent => e.eventType === eventType
  export function assertAlarmTriggeredEvent(e: ChangeEvent): asserts e is AlarmTriggeredEvent {
    if (isAlarmTriggeredEvent(e)) return
    throw new Error(`Unexpected EventType, Expected EventType: AlarmTriggeredEvent, received ${typeof e}` )
  }
}


export interface AlarmDestroyedEvent extends ChangeEvent {
  eventType: "AlarmDestroyedEvent"
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
    },
  ): AlarmDestroyedEvent => ({
    id: idProvider(),
    correlationId: data.correlationId ?? idProvider(),
    causationId: data.causationId ?? idProvider(),
    eventType,
    aggregateRootId: data.deviceId,
    entityId: data.alarmId,
    dateTimeOfEvent: new Date().toISOString(), // TODO: add opaque date type
  })

  export const isAlarmDestroyedEvent = (e: ChangeEvent): e is AlarmDestroyedEvent => e.eventType === eventType
  export function assertAlarmDestroyedEvent(e: ChangeEvent): asserts e is AlarmDestroyedEvent {
    if (isAlarmDestroyedEvent(e)) return
    throw new Error(`Unexpected EventType, Expected EventType: AlarmDestroyedEvent, received ${typeof e}` )
  }
}
