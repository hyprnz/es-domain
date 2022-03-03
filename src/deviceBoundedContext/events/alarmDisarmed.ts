import { AbstractChangeEvent } from "../../EventSourcing/EventSourcingTypes";
import { UUID } from "../../EventSourcing/UUID";

export class AlarmDisarmedEvent extends AbstractChangeEvent {
  static readonly eventType = "Alarm.DisarmedEvent";

  constructor(deviceId: UUID, alarmId: UUID) {
    super(AlarmDisarmedEvent.eventType, deviceId, alarmId);
  }
}