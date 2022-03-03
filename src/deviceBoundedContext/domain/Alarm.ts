import * as Uuid from '../../EventSourcing/UUID'
import { Entity, ParentAggregate } from "../../EventSourcing/EventSourcingTypes";
import { AlarmArmedEvent, AlarmDisarmedEvent, AlarmTriggeredEvent } from "../events";
import { DeviceDomainError } from "./DeviceDomainError";
import { ChildEntity, Emits } from '../../EventSourcing/decorators';

// TODO: do we want this decorator? replaces registering entity in constructor...
// @ChildEntity
export class Alarm implements Entity {    
  private isArmed: boolean = false
  private threshold: number = 0;
  private isTriggered: boolean = false;

  constructor(readonly aggregate: ParentAggregate, readonly id: Uuid.UUID) {
    this.aggregate.registerChildEntity(this)
  }

  armAlarm(alarmThreshold: number):void {
    if(alarmThreshold < 0 || alarmThreshold > 100) {
      throw new DeviceDomainError(this.aggregate.id(), "Alarm threshold Failed Validation")
    }
    if(!this.isArmed) {
      this.arm({ threshold: alarmThreshold })
    }
  }

  disarmAlarm(): void {
    if(this.isArmed){
      this.disarm()
    }
  }

  isAlarmTriggered(value: number): boolean {
    if(value < this.threshold) return false

    if(this.isArmed && !this.isTriggered){
      this.trigger()
    }
    
    return true
  }  

  toString() {return  `Alarm:${this.id}`}

  ////// These methods mutate state

  @Emits(AlarmArmedEvent)
  private arm (data: { threshold: number }) {
    this.isArmed = true
    this.threshold = data.threshold
  }

  @Emits(AlarmDisarmedEvent)
  private disarm () {
    this.isArmed = false
  }

  @Emits(AlarmTriggeredEvent)
  private trigger () {
    this.isTriggered = true
  }
}