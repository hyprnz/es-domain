import { AggregateRoot } from "../../EventSourcing/AggregateRoot";
import * as Uuid from "../../EventSourcing/UUID";
import { DeviceCreated } from "./events/deviceEvents";

export class  Device extends AggregateRoot {
  constructor(id?: Uuid.UUID){
    super()

    this.registerHandler('DeviceCreatedEvent', (evt:DeviceCreated) => {super.id = evt.aggregateId})

    if(id){
      // This is a new object
      this.applyChange(new DeviceCreated(id))
    }
  }
}