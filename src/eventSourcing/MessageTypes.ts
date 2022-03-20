import * as Uuid from "./UUID";

export const UNINITIALISED_AGGREGATE_VERSION = -1;

export interface Message {
  readonly id: Uuid.UUID;
  readonly correlationId: Uuid.UUID;
  readonly causationId: Uuid.UUID;
}

export interface ExternalEvent extends Message {
  eventId: string;
  readonly eventType: string;
}

export interface ChangeEvent extends Message {
  readonly eventType: string
  readonly entityId: Uuid.UUID
  readonly aggregateRootId: Uuid.UUID
  readonly dateTimeOfEvent: string
}

export interface EntityEvent {
  version: number;
  readonly event: ChangeEvent;
}

export interface EventData {
  aggregateRootId: Uuid.UUID,
  entityId: Uuid.UUID,
  correlationId?: Uuid.UUID,
  causationId?: Uuid.UUID,
}

export type EventFactory<T extends ChangeEvent, D = {}> = (
  idProvider: () => Uuid.UUID,
  data: D & EventData
  ) => T;
