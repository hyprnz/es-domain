import {makeNoOpLogger} from "./Logger";
import {EventBusError} from "./EventBusError";
import {UUID} from "./UUID";

export interface EventBus<E> {
    registerHandlerForEvents<T extends E>(handler: (events: T[]) => Promise<void>): void
    callHandlers<T extends E>(events: T[]): Promise<void>
}

export class EventBusProcessor<E> {
    private eventHandlerFor: any[] = []

    constructor(private logger = makeNoOpLogger()) {
    }

    registerHandlerForEvent<T extends E>(handler: (events: T[]) => Promise<unknown>): void {
        this.eventHandlerFor.push(handler)
    }

    async callHandlers<T extends E>(id: UUID, eventType: string, eventId: string, event: T): Promise<void> {
        const errors: string[] = []
        for (const handler of this.eventHandlerFor) {
            this.logger.debug(`handling event type: ${eventType!} with id: ${id}`)
            await handler(event).catch((e: Error) => errors.push(messageFrom(e)))
        }
        if (errors.length > 0) {
            errors.forEach((err) => this.logger.error(err))
            throw new EventBusError(
                id, eventId, eventType,
                errors
            )
        }
    }
}

export const isString = (s: any): s is string => {
    return typeof s === 'string';
}

const messageFrom = (e: any): string => {
    return isString(e?.message) ? e?.message : 'Unknown error message'
}

