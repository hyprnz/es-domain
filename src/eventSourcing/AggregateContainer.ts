import * as Uuid from './UUID'
import {AggregateError} from './AggregateError'
import {ChangeEvent, EntityEvent, UNINITIALISED_AGGREGATE_VERSION} from './MessageTypes'
import {EntityBase} from './EntityBase'
import {Aggregate} from "./Aggregate";

export class AggregateContainer<T extends EntityBase> implements Aggregate {
    public _rootEntity: T | undefined
    private changes: Array<EntityEvent> = []
    private causationId?: Uuid.UUID;
    private correlationId?: Uuid.UUID;

    get changeVersion(): number {
        return this.version
    }

    get rootEntity(): T {
        if (!this._rootEntity) {
            throw new Error(`Root has not been initialised`)
        }
        return this._rootEntity
    }

    set rootEntity(value) {
        this._rootEntity = value
    }

    get id(): Uuid.UUID {
        return this.rootEntity.id
    }

    constructor(private version = UNINITIALISED_AGGREGATE_VERSION) {
    }

    loadFromHistory(history: EntityEvent[]): void {
        history.forEach(evt => {
            const expectedVersion = this.version + 1
            if (expectedVersion !== evt.version) {
                throw new AggregateError(typeof this, 'Failed to load unexpected event version')
            }

            this.applyEvent(evt.event)
            this.version = evt.version
        })
    }

    uncommittedChanges(): EntityEvent[] {
        return this.changes.map(x => ({
                version: x.version,
                event: {
                    ...x.event,
                    causationId: this.causationId ?? x.event.causationId,
                    correlationId: this.correlationId ?? x.event.causationId,
                },
            })
        )

    }

    markChangesAsCommitted(version: number): void {
        this.changes = []
        this.version = version
    }

    toString() {
        return `AggregateRoot:${this.id}, Version:${this.changeVersion}`
    }

    withCausation(causationId: Uuid.UUID): this {
        this.causationId = causationId
        return this
    }

    withCorrelation(correlationId: Uuid.UUID): this {
        this.correlationId = correlationId
        return this
    }

    /** Observes a new change to the Domain Object */
    observe(evt: ChangeEvent) {
        const currentVersion = this.changes.length
            ? this.changes[this.changes.length - 1].version
            : this.version
        this.changes.push({
            event: evt,
            version: currentVersion + 1
        })
    }

    /** Actions an event on the domain object */
    private applyEvent(evt: ChangeEvent) {
        this.rootEntity.handleChangeEvent(evt)
    }
}


