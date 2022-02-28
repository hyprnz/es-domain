import {
  AbstractChangeEvent,
  ChangeEvent,
} from "../../EventSourcing/EventSourcingTypes";
import { UUID } from "../../EventSourcing/UUID";

export class DeviceDomainError extends Error {
  constructor(public readonly aggregateRootId: UUID, message: string) {
    super(message);
  }
}

export class DeviceCreatedEvent extends AbstractChangeEvent {
  static readonly eventType = "Device.CreatedEvent";
  readonly eventType = DeviceCreatedEvent.eventType;

  constructor(deviceId: UUID) {
    super(deviceId, deviceId)
  }
}

export class AlarmCreatedEvent extends AbstractChangeEvent {
  static readonly eventType = "Alarm.CreatedEvent";
  readonly eventType = AlarmCreatedEvent.eventType;

  constructor(deviceId: UUID, entityId: UUID, readonly delta: { alarmId: UUID }) {
    super(deviceId, deviceId, delta)
  }
}

export class AlarmArmedEvent extends AbstractChangeEvent {
  static readonly eventType = "Alarm.ArmedEvent";
  readonly eventType = AlarmArmedEvent.eventType;
  constructor(
    deviceId: UUID,
    alarmId: UUID,
    readonly delta: { threshold: number }
  ) {
    super(deviceId, alarmId, delta)
  }
  // TODO: do we need event type assertion methods?
  static assertIsAlarmArmedEvent(
    event: ChangeEvent
  ): asserts event is AlarmArmedEvent {
    if (event instanceof AlarmArmedEvent) return;

    throw new Error(
      `Unexpected EventType, Expected EventType: ${AlarmArmedEvent.eventType}, received ${typeof event}`
    );
  }
}

export class AlarmDisarmedEvent extends AbstractChangeEvent {
  static readonly eventType = "Alarm.DisarmedEvent";
  readonly eventType = AlarmDisarmedEvent.eventType;

  constructor(deviceId: UUID, alarmId: UUID) {
    super(deviceId, alarmId)
  }
}

export class AlarmTriggeredEvent extends AbstractChangeEvent {
  static readonly eventType = "Alarm.Triggered";
  readonly eventType = AlarmTriggeredEvent.eventType;

  constructor(deviceId: UUID, alarmId: UUID) {
    super(deviceId, alarmId)
  }
}

export class AlarmDestroyedEvent extends AbstractChangeEvent {
  static readonly eventType = "Alarm.Distroyed";
  readonly eventType = AlarmDestroyedEvent.eventType;

  constructor(deviceId: UUID, entityId: UUID, readonly delta: { alarmId: UUID }) {
    super(deviceId, deviceId)
  }
}
