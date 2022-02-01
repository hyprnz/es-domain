import { IChangeEvent } from "../../../EventSourcing/EventSourcingTypes";
import * as Uuid from "../../../EventSourcing/UUID";

export class DeviceCreated implements IChangeEvent {
  eventType: string;
  aggregateId: Uuid.UUID;

  constructor(id: Uuid.UUID){
    this.eventType = 'DeviceCreatedEvent'
    this.aggregateId = id
  }

}