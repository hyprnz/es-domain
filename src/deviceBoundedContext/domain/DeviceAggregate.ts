import {Device} from '..'
import * as Uuid from '../../eventSourcing/UUID'
import {AggregateContainer} from "../../eventSourcing/AggregateContainer";
import {EntityEvent} from "../../eventSourcing/MessageTypes";
import {DeviceCreatedEvent} from "../events/internal/DeviceEvents";

export class DeviceAggregate extends AggregateContainer<Device> {

    withDevice(id: Uuid.UUID): this {
        this.rootEntity = new Device((evt)=>this.observe(evt))
        this.rootEntity.applyChangeEventWithObserver(new DeviceCreatedEvent(id, id))
        return this
    }

    loadFromHistory(history: EntityEvent[]): void {
        this.rootEntity = new Device((evt)=>this.observe(evt))
        super.loadFromHistory(history)
    }

}