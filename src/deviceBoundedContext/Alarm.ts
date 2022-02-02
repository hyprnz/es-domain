import { Aggregate } from "../EventSourcing/Aggregate";
import { IParentAggregateRoot } from "../EventSourcing/EventSourcingTypes";
import * as Uuid from '../EventSourcing/UUID'
import { AlarmCreatedEvent, assertIsAlarmCreatedEvent } from "./events/deviceEvents";

export class Alarm extends Aggregate {
  constructor(parent: IParentAggregateRoot, id?: Uuid.UUID){
    super(parent)

    this.registerHandler('AlarmCreatedEvent', (evt) => {
      assertIsAlarmCreatedEvent(evt)
      super.id = evt.alarmId
    })

    if(id){
      // This is a new object
      this.applyChange(new AlarmCreatedEvent(parent.id(), id))
    }
  }

}