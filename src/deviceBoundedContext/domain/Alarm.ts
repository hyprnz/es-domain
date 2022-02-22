import * as Uuid from '../../EventSourcing/UUID'
import { EntityBase } from "../../EventSourcing/Entity";
import { ChangeEvent, ParentAggregate, StaticEventHandler } from "../../EventSourcing/EventSourcingTypes";
import { AlarmArmedEvent, AlarmCreatedEvent, AlarmDestroyedEvent, AlarmDisarmedEvent, AlarmTriggeredEvent, DeviceDomainError } from "../events/deviceEvents";

export class Alarm extends EntityBase {    
  private isArmed: boolean = false
  private threshold: number = 0;
  private isTriggered: boolean = false;

  constructor(parent: ParentAggregate, id?: Uuid.UUID){
    super(parent)

    if(id){
      // This is a new object
      this.applyChange(new AlarmCreatedEvent(this.parentId, id))
    }
  }

  armAlarm(alarmThreshold: number):void {
    if(alarmThreshold < 0 || alarmThreshold > 100) {
      throw new DeviceDomainError(this.parentId, "Alarm threshold Failed Validation")
    }
    if(!this.isArmed) {
      this.applyChange(new AlarmArmedEvent(this.parentId, this.id, alarmThreshold))    
    }
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

  toString() {return  `Alarm:${this.id}`}

  protected override makeEventHandler(evt: ChangeEvent) : (() => void) | undefined {
    const handlers: Array<()=>void> = []

    const handler = Alarm.eventHandlers[evt.eventType]
    if(handler) handlers.push(() => handler.forEach(x => x.call(this, this, evt)))
    
    return (handlers.length) 
    ?  () => {handlers.forEach(x => x())}
    : undefined
  }
  
  static readonly eventHandlers: Record<string, Array<StaticEventHandler<Alarm>>> = {
    [AlarmCreatedEvent.eventType]: [(alarm, evt) => alarm.id = evt.entityId],
    [AlarmDisarmedEvent.eventType]: [(alarm) => alarm.isArmed = false],
    [AlarmArmedEvent.eventType]: [(alarm, evt) => {
      AlarmArmedEvent.assertIsAlarmArmedEvent(evt)
      alarm.isArmed = true; 
      alarm.threshold = evt.threshold
    }],
    [AlarmTriggeredEvent.eventType]:[(alarm) => alarm.isTriggered = true],
    [AlarmDestroyedEvent.eventType]:[() => {}]
  }
}