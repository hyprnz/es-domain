import * as Uuid from './UUID'
import {AggregateError} from './AggregateError'
import {ChangeEvent} from './MessageTypes'
import {Entity} from "./Entity";
import {ChangeObserver} from "./Aggregate";

export abstract class EntityBase implements Entity {
    private _id: Uuid.UUID | undefined
    get id(): Uuid.UUID {
        if (!this._id) {
            throw new Error(`Entity id not initialised`)
        }
        return this._id
    }
    set id(value) {
        this._id = value
    }

    protected constructor(protected observer: ChangeObserver) {
    }

    applyChangeEvent(evt: ChangeEvent): void {
        this.applyEvent(evt)
    }

    toString() {
        return `Entity ${this.id}}`
    }

    /** Applies a new change to the Domain Object */
    applyChangeEventWithObserver(evt: ChangeEvent): void {
        this.applyEvent(evt)
        this.observer(evt)
    }

    /** Applies an existing event to the Entity **/
    private applyEvent(evt: ChangeEvent) {
        const eventHandler = this.makeEventHandler(evt)
        if (!eventHandler) throw new AggregateError(this.toString(), `Event Handlers not found for eventType:${evt.eventType}`)
        eventHandler()
    }

    protected abstract makeEventHandler(evt: ChangeEvent): (() => void) | undefined
}

