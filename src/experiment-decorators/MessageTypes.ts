import { Uuid } from '..'

export const UNINITIALISED_AGGREGATE_VERSION = -1

export interface Message {
  id: Uuid.UUID
  correlationId: Uuid.UUID
  causationId: Uuid.UUID
}

export interface ExternalEvent extends Message {
  eventId: string
  readonly eventType: string
}

export interface ChangeEvent extends Message {
  eventType: string
  entityId: Uuid.UUID
  aggregateRootId: Uuid.UUID
  dateTimeOfEvent: string
}

export interface EntityEvent {
  version: number
  readonly event: ChangeEvent
}

export interface EventData {
  aggregateRootId: Uuid.UUID
  entityId: Uuid.UUID
  correlationId?: Uuid.UUID
  causationId?: Uuid.UUID
}

export type ChangeEventFactory<T extends ChangeEvent, D = {}> = (idProvider: () => Uuid.UUID, data: D & EventData) => T

export const baseChangeEventBuilder = (idProvider: () => Uuid.UUID, data: EventData) => {
  return {
    id: idProvider(),
    correlationId: data.correlationId ?? idProvider(),
    causationId: data.causationId ?? idProvider(),
    aggregateRootId: data.aggregateRootId,
    entityId: data.entityId,
    dateTimeOfEvent: new Date().toISOString() // TODO: add opaque date type
  }
}
