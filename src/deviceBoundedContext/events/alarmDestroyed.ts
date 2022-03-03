import { AbstractChangeEvent } from "../../EventSourcing/EventSourcingTypes";
import { UUID } from "../../EventSourcing/UUID";

export interface DestroyAlarmPayload {
  alarmId: UUID
}

export class AlarmDestroyedEvent extends AbstractChangeEvent {
  static readonly eventType = "Alarm.Distroyed";

  override payload: DestroyAlarmPayload;

  constructor(
    deviceId: UUID,
    _: UUID,
    payload: DestroyAlarmPayload
  ) {
    super(AlarmDestroyedEvent.eventType, deviceId, deviceId);
    this.payload = payload
  }
}