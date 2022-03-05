import {UUID} from "./UUID";

export class EventBusError extends Error {
    constructor(id: UUID, eventId: string, eventType: string, errors: string[]) {
        super(`Event bus error for event with id: ${id} eventId: ${eventId} for eventType: ${eventType} errors: ${errors.join(', ')}`);
    }
}