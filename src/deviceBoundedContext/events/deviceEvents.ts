import { Alarm } from "..";
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
  constructor(public eventType:string, public readonly aggregateRootId: Uuid.UUID, readonly entityId: Uuid.UUID){
    this.id = Uuid.createV4()
  }
}

export class DeviceCreatedEvent implements IChangeEvent {
  static readonly  eventType = 'Device.CreatedEvent'
  readonly id: Uuid.UUID;
  readonly eventType : string

  constructor(public readonly aggregateRootId: Uuid.UUID, readonly entityId: Uuid.UUID){
    this.eventType = DeviceCreatedEvent.eventType
    this.id = Uuid.createV4()
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
  constructor(aggregateRootId: Uuid.UUID, alarmId: Uuid.UUID, public threshold: number){
    super(AlarmArmedEvent.eventType, aggregateRootId, alarmId)    
  } 

  static assertIsAlarmArmedEvent(event: IChangeEvent) : asserts event is AlarmArmedEvent{
    if(event instanceof AlarmArmedEvent)  return

    throw new Error(`Unexpected EventType, Expected EventType: AlarmArmedEvent, received ${typeof event}` ) 
  }
}


export class AlarmDisarmedEvent extends AbstractChangeEvent {
  static readonly  eventType = 'Alarm.DisarmedEvent'
  
  constructor(aggregateRootId: Uuid.UUID, alarmId: Uuid.UUID){
    super(AlarmDisarmedEvent.eventType, aggregateRootId, alarmId)
  } 

  static assertIsAlarmDisarmedEvent(event: IChangeEvent) : asserts event is AlarmDisarmedEvent{
    if(event instanceof AlarmDisarmedEvent)  return

    throw new Error(`Unexpected EventType, Expected EventType: AlarmDisarmedEvent, received ${typeof event}` ) 
  }
}


export class AlarmTriggeredEvent extends AbstractChangeEvent {
  static readonly  eventType = 'Alarm.Triggered'
  
  constructor(aggregateRootId: Uuid.UUID, alarmId: Uuid.UUID){
    super(AlarmTriggeredEvent.eventType, aggregateRootId, alarmId)
  } 

  static assertIsAlarmTriggeredEvent(event: IChangeEvent) : asserts event is AlarmTriggeredEvent{
    if(event instanceof AlarmTriggeredEvent)  return

    throw new Error(`Unexpected EventType, Expected EventType: AlarmTriggeredEvent, received ${typeof event}` ) 
  }
}
