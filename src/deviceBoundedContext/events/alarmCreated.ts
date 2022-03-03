import { AbstractChangeEvent, ChangeEvent } from "../../EventSourcing/EventSourcingTypes";
import { UUID } from "../../EventSourcing/UUID";

export interface CreateAlarmPayload {
  alarmId: UUID,
}

export class AlarmCreatedEvent extends AbstractChangeEvent {
  static readonly eventType = "Alarm.CreatedEvent";

  override payload: CreateAlarmPayload

  constructor(
    deviceId: UUID,
    _: UUID,
    payload: CreateAlarmPayload
  ) {
    super(AlarmCreatedEvent.eventType, deviceId, deviceId);
    this.payload = payload;
  }

  // TODO: used in read side... do we need?
  static isAlarmCreatedEvent(event: ChangeEvent): event is AlarmCreatedEvent {
    return event instanceof AlarmCreatedEvent;
  }
}