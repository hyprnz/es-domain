import {ExternalEvent} from "../eventSourcing/MessageTypes";
import * as Uuid from "../eventSourcing/UUID";

export class ExternalEventBuilder {
    private readonly externalEvent: ExternalEvent

    private constructor() {
        this.externalEvent = {
            id: Uuid.createV4(),
            eventId: Uuid.createV4(),
            eventType: 'some-event-type',
            correlationId: Uuid.createV4(),
            causationId: Uuid.createV4()
        }
    }

    to(): ExternalEvent {
        return this.externalEvent
    }

    static make() {
        return new ExternalEventBuilder()
    }
}