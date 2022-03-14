import {Device} from '..'
import * as Uuid from '../../eventSourcing/UUID'
import {AggregateContainer} from "../../eventSourcing/AggregateContainer";
import {EntityEvent} from "../../eventSourcing/MessageTypes";

export class DeviceAggregate extends AggregateContainer<Device> {

    constructor() {
        super(Device);
    }

    withDevice(id: Uuid.UUID): this {
        super.createRoot(id)
        return this
    }

    loadFromHistory(history: EntityEvent[]): void {
        super.createRootForLoading()
        super.loadFromHistory(history)
    }

}