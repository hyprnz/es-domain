import {makeNoOpLogger} from "./Logger";
import {EventBusError} from "./EventBusError";

export interface EventBus<E> {
    registerHandlerForEvents<T extends E>(handler: (events: T[]) => Promise<void>): void

    callHandlers<T extends E>(events: T[]): Promise<void>
}

export class EventBusProcessor<E> {
    private eventHandlerFor: Array<(events: any[]) => Promise<unknown>> = []

    constructor(private logger = makeNoOpLogger()) {
    }

    registerHandlerForEvents<T extends E>(handler: (events: T[]) => Promise<unknown>): void {
        this.eventHandlerFor.push(handler)
    }

    async callHandlers<T extends E>(events: T[]): Promise<void> {
        const errors: string[] = []
        for (const handler of this.eventHandlerFor) {
            await handler(events).catch((e: Error) => errors.push(messageFrom(e)))
        }
        if (errors.length > 0) {
            errors.forEach((err) => this.logger.error(err))
            throw new EventBusError(
                events,
                errors
            )
        }
    }
}

export const isString = (s: any): s is string => {
    return typeof s === 'string';
}

const messageFrom = (e: any): string => {
    return isString(e?.message) ? e.message : 'Unknown error message'
}

