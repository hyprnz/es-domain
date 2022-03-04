import { AbstractChangeEvent } from "../../EventSourcing/AbstractChangeEvent";
import { ChangeEvent } from "../../EventSourcing/EventSourcingTypes";
import * as Uuid from "../../EventSourcing/UUID";

export class DeviceDomainError  extends Error {
  constructor(public readonly aggregateRootId: Uuid.UUID, message:string){
    super(message)
  }
}
export class DeviceCreatedEvent extends AbstractChangeEvent {
  static readonly  eventType = 'Device.CreatedEvent'

  constructor(aggregateRootId: Uuid.UUID, entityId: Uuid.UUID){
    super(DeviceCreatedEvent.eventType, aggregateRootId, entityId)    
  }
}

export class AlarmCreatedEvent extends AbstractChangeEvent {
  static readonly  eventType = 'Alarm.CreatedEvent'

  constructor(aggregateRootId: Uuid.UUID, alarmId: Uuid.UUID){
    super(AlarmCreatedEvent.eventType, aggregateRootId, alarmId)    
  }

  static assertIsAlarmCreatedEvent(event: ChangeEvent): asserts event is AlarmCreatedEvent{
    if(event.eventType === AlarmCreatedEvent.eventType) return
    
    throw new Error(`Unexpected EventType, Expected EventType: AlarmCreatedEvent, received ${typeof event}` )
  }
}

export class AlarmArmedEvent extends AbstractChangeEvent {
  static readonly  eventType = 'Alarm.ArmedEvent'
  constructor(aggregateRootId: Uuid.UUID, alarmId: Uuid.UUID, public threshold: number){
    super(AlarmArmedEvent.eventType, aggregateRootId, alarmId)    
  } 

  static assertIsAlarmArmedEvent(event: ChangeEvent) : asserts event is AlarmArmedEvent{
    if(event.eventType === AlarmArmedEvent.eventType)  return

    throw new Error(`Unexpected EventType, Expected EventType: AlarmArmedEvent, received ${typeof event}` ) 
  }
}


export class AlarmDisarmedEvent extends AbstractChangeEvent {
  static readonly  eventType = 'Alarm.DisarmedEvent'
  
  constructor(aggregateRootId: Uuid.UUID, alarmId: Uuid.UUID){
    super(AlarmDisarmedEvent.eventType, aggregateRootId, alarmId)
  } 

  static assertIsAlarmDisarmedEvent(event: ChangeEvent) : asserts event is AlarmDisarmedEvent{
    if(event.eventType ===  AlarmDisarmedEvent.eventType)  return

    throw new Error(`Unexpected EventType, Expected EventType: AlarmDisarmedEvent, received ${typeof event}` ) 
  }
}


export class AlarmTriggeredEvent extends AbstractChangeEvent {
  static readonly  eventType = 'Alarm.Triggered'
  
  constructor(aggregateRootId: Uuid.UUID, alarmId: Uuid.UUID){
    super(AlarmTriggeredEvent.eventType, aggregateRootId, alarmId)
  } 

  static assertIsAlarmTriggeredEvent(event: ChangeEvent) : asserts event is AlarmTriggeredEvent{
    if(event.eventType === AlarmTriggeredEvent.eventType)  return

    throw new Error(`Unexpected EventType, Expected EventType: AlarmTriggeredEvent, received ${typeof event}` ) 
  }
}

export class AlarmDestroyedEvent extends AbstractChangeEvent {
  static readonly  eventType = 'Alarm.Distroyed'
  
  constructor(aggregateRootId: Uuid.UUID, alarmId: Uuid.UUID){
    super(AlarmDestroyedEvent.eventType, aggregateRootId, alarmId)
  }   
}
