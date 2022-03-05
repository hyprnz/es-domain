import {UUID} from "../../../eventSourcing/UUID";
import {DeviceService} from "../../service/DeviceService";
import {ExternalEvent} from "../../../eventSourcing/MessageTypes";
import {EventStoreExternal} from "../../../eventStoreExternal/EventStoreExternal";

export interface AlarmTriggeredByExternalSystemEvent extends ExternalEvent {
    readonly causationId: UUID;
    readonly correlationId: UUID;
    readonly eventId: string;
    readonly eventType: string;
    readonly id: UUID;
    readonly deviceId: UUID;
    readonly alarmId: UUID;
}

export class AlarmTriggeredByExternalSystemEventConsumer {
    constructor(private eventStoreExternal: EventStoreExternal) {
    }

    async consume(event: AlarmTriggeredByExternalSystemEvent) {
        await this.eventStoreExternal.process(event)
    }
}

export class AlarmTriggeredByExternalSystemEventHandler {
    constructor(private deviceService: DeviceService) {
    }

    async handle(events: AlarmTriggeredByExternalSystemEvent[]): Promise<void> {
        for (const event of events) {
            await this.deviceService.triggerAlarm(event.deviceId, event.alarmId)
        }
    }
}