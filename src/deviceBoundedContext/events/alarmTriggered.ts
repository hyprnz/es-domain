import { AbstractChangeEvent } from "../../EventSourcing/EventSourcingTypes";
import { UUID } from "../../EventSourcing/UUID";


export class AlarmTriggeredEvent extends AbstractChangeEvent {
  static readonly eventType = "Alarm.Triggered";

  constructor(deviceId: UUID, alarmId: UUID) {
    super(AlarmTriggeredEvent.eventType, deviceId, alarmId);
  }
}