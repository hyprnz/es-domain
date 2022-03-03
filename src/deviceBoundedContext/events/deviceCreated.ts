import { AbstractChangeEvent } from "../../EventSourcing/EventSourcingTypes";
import { UUID } from "../../EventSourcing/UUID";

export class DeviceCreatedEvent extends AbstractChangeEvent {
  static readonly eventType = "Device.CreatedEvent";

  constructor(deviceId: UUID) {
    super(DeviceCreatedEvent.eventType, deviceId, deviceId);
  }
}