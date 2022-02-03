import { Entity, EventHandler, StaticEventHandler } from "../EventSourcing/Aggregate";
import { IChangeEvent, IParentAggregateRoot } from "../EventSourcing/EventSourcingTypes";
import * as Uuid from '../EventSourcing/UUID'
import { AlarmArmedEvent, AlarmCreatedEvent, AlarmDisarmedEvent, AlarmTriggeredEvent, DeviceDomainError } from "./events/deviceEvents";

export class Alarm extends Entity {
  
  private isArmed: boolean = false
  private threshold: number;
  private isTriggered: boolean;

  constructor(parent: IParentAggregateRoot, id?: Uuid.UUID){
    super(parent)

    // this.registerHandler(AlarmCreatedEvent.eventType, (evt) => {AlarmCreatedEvent.assertIsAlarmCreatedEvent(evt), this.id = evt.alarmId})
    // this.registerHandler(AlarmDisarmedEvent.eventType, () => this.isArmed = false)
    // this.registerHandler(AlarmArmedEvent.eventType, (evt) => { 
    //   AlarmArmedEvent.assertIsAlarmArmedEvent(evt); 
    //   this.isArmed = true; 
    //   this.threshold = evt.threshold
    // })
    // this.registerHandler(AlarmTriggeredEvent.eventType, () => this.isTriggered = true)

    if(id){
      // This is a new object
      this.applyChange(new AlarmCreatedEvent(this.parentId, id))
    }
  }

  armAlarm(alarmThreshold: number):void {
    if(alarmThreshold < 0 || alarmThreshold > 100) {
      throw new DeviceDomainError(this.parentId, "Alarm threshold Failed Validation")
    }
    if(this.isArmed) this.disarmAlarm()
    this.applyChange(new AlarmArmedEvent(this.parentId, this.id, alarmThreshold))    
  }

  disarmAlarm():void {
    if(this.isArmed){
      this.applyChange(new AlarmDisarmedEvent(this.parentId, this.id))
    }
  }

  isAlarmTriggered(value: number): boolean {
    if(value < this.threshold) return false

    if(this.isArmed && !this.isTriggered){
      // Emit trigger event
      this.applyChange(new AlarmTriggeredEvent(this.parentId, this.id))
    }
    
    return true
  }

  toString() {return  'Alarm'}

  protected override makeEventHandler(evt: IChangeEvent) : () => void | undefined{
    const handler = Alarm.eventHandlers[evt.eventType]
    return handler 
      ? () => handler.forEach(x => x.call(this, this, evt))
      : undefined
  }
  
  static readonly eventHandlers: Record<string, Array<StaticEventHandler<Alarm>>> = {
    [AlarmCreatedEvent.eventType]: [(alarm, evt) => {AlarmCreatedEvent.assertIsAlarmCreatedEvent(evt), alarm.id = evt.entityId}],
    [AlarmDisarmedEvent.eventType]: [(alarm) => alarm.isArmed = false],
    [AlarmArmedEvent.eventType]: [(alarm, evt) => {
      AlarmArmedEvent.assertIsAlarmArmedEvent(evt)
      alarm.isArmed = true; 
      alarm.threshold = evt.threshold
    }],
    [AlarmTriggeredEvent.eventType]:[(alarm, evt) => alarm.isTriggered = true]
  }
}