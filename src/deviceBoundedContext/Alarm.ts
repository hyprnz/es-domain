import { Aggregate } from "../EventSourcing/Aggregate";
import { IParentAggregateRoot } from "../EventSourcing/EventSourcingTypes";
import * as Uuid from '../EventSourcing/UUID'
import { AlarmArmedEvent, AlarmCreatedEvent, AlarmDisarmedEvent, AlarmTriggeredEvent, DeviceDomainError } from "./events/deviceEvents";

export class Alarm extends Aggregate {
  
  private isArmed: boolean = false
  private threshold: number;
  private isTriggered: boolean;

  constructor(parent: IParentAggregateRoot, id?: Uuid.UUID){
    super(parent)

    this.registerHandler(AlarmCreatedEvent.eventType, (evt) => {AlarmCreatedEvent.assertIsAlarmCreatedEvent(evt), super.id = evt.alarmId})
    this.registerHandler(AlarmDisarmedEvent.eventType, () => this.isArmed = false)
    this.registerHandler(AlarmArmedEvent.eventType, (evt) => { 
      AlarmArmedEvent.assertIsAlarmArmedEvent(evt); 
      this.isArmed = true; 
      this.threshold = evt.threshold
    })
    this.registerHandler(AlarmTriggeredEvent.eventType, () => this.isTriggered = true)

    if(id){
      // This is a new object
      this.applyChange(new AlarmCreatedEvent(parent.id(), id))
    }
  }

  armAlarm(alarmThreshold: number):void {
    if(alarmThreshold < 0 || alarmThreshold > 100) {
      throw new DeviceDomainError(this.parent.id(), "Alarm threshold Failed Validation")
    }
    if(this.isArmed) this.disarmAlarm()
    this.applyChange(new AlarmArmedEvent(super.parent.id(), this.id, alarmThreshold))    
  }

  disarmAlarm():void {
    if(this.isArmed){
      this.applyChange(new AlarmDisarmedEvent(super.parent.id(), this.id))
    }
  }

  isAlarmTriggered(value: number): boolean {
    if(value < this.threshold) return false

    if(this.isArmed && !this.isTriggered){
      // Emit trigger event
      this.applyChange(new AlarmTriggeredEvent(this.parent.id(), this.id))
    }
    
    return true
  }

}