import * as Uuid from "./UUID";

export const UNINITIALISED_AGGREGATE_VERSION = -1;

export interface Message {
  readonly id: Uuid.UUID;


  // This should be optional ?
  readonly causationId?: Uuid.UUID;
  readonly correlationId?: Uuid.UUID;
}

export interface ExternalEvent extends Message {
  eventId: string;
  readonly eventType: string;
}

export interface ChangeEvent extends Message {
  /** @description event type descriminator   */
  readonly eventType: string

  /** @description Id of aggregate root */
  readonly aggregateRootId: Uuid.UUID

  /** @description id of child entity within the aggregateRoot*/
  readonly entityId: Uuid.UUID

  /** @description time that the event occured
   * (may be different from the time received)
  */
  readonly dateTimeOfEvent: string
}

export interface EntityEvent {
  version: number;
  readonly event: ChangeEvent;
}
