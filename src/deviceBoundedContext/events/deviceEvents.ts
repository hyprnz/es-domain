import { IChangeEvent } from "../../EventSourcing/EventSourcingTypes";
import * as Uuid from "../../EventSourcing/UUID";

type DeviceAggregateRootEvents = 
  DeviceCreatedEvent |
  AlarmCreatedEvent

export class DeviceCreatedEvent implements IChangeEvent {
  static readonly  eventType = 'DeviceCreatedEvent'
  readonly id: Uuid.UUID;
  get eventType() {return DeviceCreatedEvent.eventType}

  constructor(public aggregateRootId: Uuid.UUID){
    this.id = Uuid.createV4()
  }
}

export class AlarmCreatedEvent implements IChangeEvent {
  static readonly  eventType = 'AlarmCreatedEvent'
  readonly id: Uuid.UUID;
  get eventType() {return DeviceCreatedEvent.eventType}

  constructor(public readonly aggregateRootId: Uuid.UUID, public readonly alarmId: Uuid.UUID){
    this.id = Uuid.createV4()
  }
}


export function assertIsAlarmCreatedEvent(event: IChangeEvent): asserts event is AlarmCreatedEvent{
  if(!event || !(event instanceof AlarmCreatedEvent)) 
    throw new Error(`Unexpected EventType, Expected EventType: AlarmCreatedEvent, received ${typeof event}` )
}