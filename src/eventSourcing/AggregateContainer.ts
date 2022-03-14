import * as Uuid from './UUID'
import {AggregateError} from './AggregateError'
import {ChangeEvent, EntityEvent, UNINITIALISED_AGGREGATE_VERSION} from './MessageTypes'
import {EntityBase} from './EntityBase'
import {EntityConstructor} from "./Entity";
import {Aggregate, ParentAggregate} from "./Aggregate";


// For aggregate roots consider not extending them to be treated as an entity.
// Instead aggregate root could become a container that has one entity that is the RootEntity of the Aggregate !!
// this would be a switch from inheritance to composition
// This may be a little clunky to use, but worth exploring
// PROS : we would end up with a single implementation of aggregateRoot with a generic for the RootEntity Type
// CONS : When we create and hydrate an aggregate root, we then need to access the root entity via a getter. 
//        We must still hold on to the aggregate root as it would be needed to persist any changes.
//        Though if we have a layered system, the service layer could be responsible for creating aggregate roots 
//        It just passes / makes use of the entities to perform domain actions

export class AggregateContainer<T extends EntityBase> implements Aggregate {
    public _rootEntity: T | undefined

    private version: number
    private changes: Array<EntityEvent> = []
    protected thisAsParent: ParentAggregate
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

    get id(): Uuid.UUID {
        return this.rootEntity.id
    }

    protected constructor(protected activator: EntityConstructor<T>) {
        this.version = UNINITIALISED_AGGREGATE_VERSION
        this.thisAsParent = {
            id: () => this.id,
            addChangeEvent: (evt) => {
                const currentVersion = this.changes.length
                    ? this.changes[this.changes.length - 1].version
                    : this.version

                this.changes.push({
                    event: evt,
                    version: currentVersion + 1
                })
            }
        }
    }

    protected createRoot(id: Uuid.UUID): void {
        this._rootEntity = new this.activator(this.thisAsParent, id)
    }

    protected createRootForLoading(): void {
        this._rootEntity = new this.activator(this.thisAsParent)
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

    /** Applies a new chnage to the Domain Object */
    protected applyChange(evt: ChangeEvent) {
        this.applyEvent(evt)
        this.changes.push({
            event: evt,
            version: UNINITIALISED_AGGREGATE_VERSION
        })
    }

    /** Actions an event on the domain object */
    private applyEvent(evt: ChangeEvent) {
        this.rootEntity.applyChangeEvent(evt)
    }
}


