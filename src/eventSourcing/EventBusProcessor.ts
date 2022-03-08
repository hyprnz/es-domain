import {makeNoOpLogger} from "./Logger";
import {EventBusError} from "./EventBusError";
import {isString} from "./EventBus";

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

const messageFrom = (e: any): string => {
    return isString(e?.message) ? e.message : 'Unknown error message'
}