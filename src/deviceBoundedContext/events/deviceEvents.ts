import { IChangeEvent } from "../../EventSourcing/EventSourcingTypes";
import * as Uuid from "../../EventSourcing/UUID";

type DeviceAggregateRootEvents = 
  DeviceCreatedEvent |
  AlarmCreatedEvent


export class DeviceDomainError  extends Error {
  constructor(public readonly aggregateRootId: Uuid.UUID, message:string){
    super(message)
  }
}
abstract class AbstractChangeEvent implements IChangeEvent{
  readonly id: Uuid.UUID;
  abstract get eventType():string
  constructor(public readonly aggregateRootId: Uuid.UUID, readonly entityId: Uuid.UUID){
    this.id = Uuid.createV4()
  }
}

export class DeviceCreatedEvent implements IChangeEvent {
  static readonly  eventType = 'Device.CreatedEvent'
  readonly id: Uuid.UUID;
  readonly eventType : string

  constructor(public aggregateRootId: Uuid.UUID, readonly entityId: Uuid.UUID){
    this.id = Uuid.createV4()
    this.eventType = DeviceCreatedEvent.eventType
  }
}

export class AlarmCreatedEvent implements IChangeEvent {
  static readonly  eventType = 'Alarm.CreatedEvent'
  
  readonly id: Uuid.UUID;
  readonly entityId: Uuid.UUID;
  readonly eventType: string

  constructor(public readonly aggregateRootId: Uuid.UUID, alarmId: Uuid.UUID){
    this.eventType =  AlarmCreatedEvent.eventType
    this.id = Uuid.createV4()
    this.entityId = alarmId
  }

  static assertIsAlarmCreatedEvent(event: IChangeEvent): asserts event is AlarmCreatedEvent{
    if(event instanceof AlarmCreatedEvent) return
    
    throw new Error(`Unexpected EventType, Expected EventType: AlarmCreatedEvent, received ${typeof event}` )
  }
}

export class AlarmArmedEvent extends AbstractChangeEvent {
  static readonly  eventType = 'Alarm.ArmedEvent'
  get eventType() {return AlarmArmedEvent.eventType}
  constructor(aggregateRootId: Uuid.UUID, alarmId: Uuid.UUID, public threshold: number){
    super(aggregateRootId, alarmId)
  } 

  static assertIsAlarmArmedEvent(event: IChangeEvent) : asserts event is AlarmArmedEvent{
    if(event instanceof AlarmArmedEvent)  return

    throw new Error(`Unexpected EventType, Expected EventType: AlarmArmedEvent, received ${typeof event}` ) 
  }
}


export class AlarmDisarmedEvent extends AbstractChangeEvent {
  static readonly  eventType = 'Alarm.DisarmedEvent'
  get eventType() {return AlarmDisarmedEvent.eventType}
  constructor(aggregateRootId: Uuid.UUID, alarmId: Uuid.UUID){
    super(aggregateRootId, alarmId)
  } 

  static assertIsAlarmDisarmedEvent(event: IChangeEvent) : asserts event is AlarmDisarmedEvent{
    if(event instanceof AlarmDisarmedEvent)  return

    throw new Error(`Unexpected EventType, Expected EventType: AlarmDisarmedEvent, received ${typeof event}` ) 
  }
}


export class AlarmTriggeredEvent extends AbstractChangeEvent {
  static readonly  eventType = 'Alarm.Triggered'
  get eventType() {return AlarmTriggeredEvent.eventType}
  constructor(aggregateRootId: Uuid.UUID, alarmId: Uuid.UUID){
    super(aggregateRootId, alarmId)
  } 

  static assertIsAlarmTriggeredEvent(event: IChangeEvent) : asserts event is AlarmTriggeredEvent{
    if(event instanceof AlarmTriggeredEvent)  return

    throw new Error(`Unexpected EventType, Expected EventType: AlarmTriggeredEvent, received ${typeof event}` ) 
  }
}
