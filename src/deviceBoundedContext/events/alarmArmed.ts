import { AbstractChangeEvent, ChangeEvent } from "../../EventSourcing/EventSourcingTypes";
import { UUID } from "../../EventSourcing/UUID";


export interface ArmAlarmPayload {
  threshold: number;
}

export class AlarmArmedEvent extends AbstractChangeEvent {
  static readonly eventType = "Alarm.ArmedEvent";

  override payload: ArmAlarmPayload;

  constructor(deviceId: UUID, alarmId: UUID, payload: ArmAlarmPayload) {
    super(AlarmArmedEvent.eventType, deviceId, alarmId);
    this.payload = payload;
  }

  // TODO: used in read side... do we need?
  static assertIsAlarmArmedEvent(
    event: ChangeEvent
  ): asserts event is AlarmArmedEvent {
    if (event instanceof AlarmArmedEvent) return;

    throw new Error(
      `Unexpected EventType, Expected EventType: ${
        AlarmArmedEvent.eventType
      }, received ${typeof event}`
    );
  }
}