import {makeNoOpLogger} from "./Logger";
import {ExternalEvent} from "./MessageTypes";
import {EventBusError} from "./EventBusError";

export class EventBus {
    protected eventHandlerFor: any = {}

    constructor(private logger = makeNoOpLogger()) {
    }

    registerHandlerForEvent<T extends ExternalEvent>(eventType: string, handler: (e: T) => Promise<unknown>): void {
        if (!this.eventHandlerFor[eventType]) {
            this.eventHandlerFor[eventType] = []
        }
        this.eventHandlerFor[eventType].push(handler)
    }

    async callHandlers<T extends ExternalEvent>(event: T): Promise<void> {
        const eventType = event.eventType
        if (isString(eventType) && Array.isArray(this.eventHandlerFor[eventType])) {
            this.logger.debug(`handler found for event: ${event.eventType!} with id: ${event.id}`)
            const errors: string[] = []
            for (const handler of this.eventHandlerFor[eventType]) {
                await handler(event).catch((e: Error) => errors.push(messageFrom(e)))
            }
            if (errors.length > 0) {
                errors.forEach((err) => this.logger.error(err))
                throw new EventBusError(
                    event.id, event.eventId, eventType,
                    errors
                )
            }
        }
    }
}


export const messageFrom = (e: any): string => {
    return isString(e?.message) ? e?.message : 'Unknown error message'
}

export const isString = (s: any): s is string => {
    return typeof s === 'string';
}
