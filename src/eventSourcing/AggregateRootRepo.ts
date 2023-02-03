import { EntityEvent, EntityBase, EntityConstructorPayload, EntityConstructor, AggregateContainer, Entity, Aggregate, isSnapshotableEntity } from "."
import { EventStoreRepository, SnapshotEventStore} from ".."
import { UUID } from "../util/UUID"
import { EventBus } from "../writeModelRepository/EventBus"
import { EventStore } from "../writeModelRepository/EventStore"

export interface PersistableEntity {
    save():  Promise<number>,
    // uncommittedChanges(): Array<EntityEvent>
}

type PersitableEntity<T extends Entity> = T & PersistableEntity
type EntityContainerPair<T extends EntityBase, U extends EntityConstructorPayload> = [PersitableEntity<T>, AggregateContainer<T,U>]

export interface AggregateRepository<T extends EntityBase, U extends EntityConstructorPayload> {
    get(id: UUID): Promise<EntityContainerPair<T,U>>
    find(id: UUID): Promise<EntityContainerPair<T,U> | undefined>
    create(creationEvent: U): Promise<EntityContainerPair<T,U>>
}

export class AggregateRootRepositoryBuilder {
    static makeEventStore(eventStoreRepo: EventStoreRepository, eventBus: EventBus<EntityEvent>): EventStore {
        return new EventStore(eventStoreRepo, eventBus)
    }

    // static makeGenericRepo<T extends EntityBase, U extends EntityConstructorPayload>(eventStore: EventStore): GenericAggregateRootRepository {
    //   return new GenericAggregateRootRepository( eventStore )
    // }

    static makeRepo<T extends EntityBase, U extends EntityConstructorPayload>(eventStore: EventStore, activator: EntityConstructor<T, U>): AggregateRepository<T,U>{
        return new SpecialisedAggregateRootRepository( eventStore, activator )
    }

    static makeSnapshotRepo<T extends EntityBase, U extends EntityConstructorPayload>(eventStore: EventStore, activator: EntityConstructor<T, U>, snapshotStore: SnapshotEventStore): AggregateRepository<T,U>{
        return new SnapshotingAggregateRootRepository( eventStore, activator, snapshotStore )
    }
}

function loadEvents(eventStore: EventStore, id: UUID, version: number=0): Promise<Array<EntityEvent>> {
if(version<=0) return eventStore.getEvents(id)
else return eventStore.getEventsAfterVersion(id, version)
}

async function save<T extends Aggregate>(eventStore: EventStore, aggregate: T): Promise<number> {
    const changes = aggregate.uncommittedChanges()
    if (changes.length === 0) {
        return Promise.resolve(0)
    }
    await eventStore.appendEvents(aggregate.id, changes[0].version, changes)
    aggregate.markChangesAsCommitted(changes[changes.length - 1].version)
    // await this.onAfterEventsStored(changes)
    return changes.length
}

class GenericAggregateRootRepository {
    constructor(private readonly eventStore: EventStore) { }

    async get<T extends EntityBase, U extends EntityConstructorPayload>(id: UUID, activator: EntityConstructor<T, U>): Promise<EntityContainerPair<T,U>> {
      const result = await this.find(id, activator)
      if(!result) throw new Error("Not Found")
      return result
    }

    async find<T extends EntityBase, U extends EntityConstructorPayload>(id: UUID, activator: EntityConstructor<T, U>): Promise<EntityContainerPair<T,U> | undefined> {
        const events = await loadEvents(this.eventStore, id)
        if(events.length === 0) return undefined

        var aggregate = new AggregateContainer(activator)
        aggregate.loadFromHistory(events)

        return this.makePersistableEntity<T, U>(aggregate)
    }

    async create<T extends EntityBase, U extends EntityConstructorPayload>(activator: EntityConstructor<T, U>, creationEvent: U): Promise<EntityContainerPair<T,U>> {
        const entity = await this.find(creationEvent.id, activator)
        if(entity) throw new Error("Entity already exists")

        var aggregate = new AggregateContainer(activator)
        aggregate.createNewAggregateRoot(creationEvent)
        return this.makePersistableEntity<T, U>(aggregate)
    }

    makePersistableEntity<T extends EntityBase, U extends EntityConstructorPayload>(container: AggregateContainer<T, U>): EntityContainerPair<T,U> {
        const persistable = Object.assign(
            container.rootEntity,
            {
                save: () => save(this.eventStore, container),
                uncommittedChanges: () => container.uncommittedChanges()
            }
        )

        return [persistable, container]
    }
}

class SpecialisedAggregateRootRepository<T extends EntityBase, U extends EntityConstructorPayload> implements AggregateRepository<T,U> {
    private genericRepo: GenericAggregateRootRepository
    constructor(readonly eventStore: EventStore, private activator: EntityConstructor<T, U>) {
        this.genericRepo  = new GenericAggregateRootRepository(eventStore)
     }

    async get(id: UUID): Promise<EntityContainerPair<T,U>> {
      return await this.genericRepo.get(id, this.activator)
    }

    async find(id: UUID): Promise<EntityContainerPair<T,U> | undefined> {
        const result = await this.genericRepo.find(id, this.activator)
        return result ? result : undefined
    }

    async create(creationEvent: U): Promise<EntityContainerPair<T,U>> {
        return await this.genericRepo.create(this.activator, creationEvent)
    }
}

class SnapshotingAggregateRootRepository<T extends EntityBase, U extends EntityConstructorPayload> implements AggregateRepository<T,U> {
    private genericRepo: GenericAggregateRootRepository
    constructor(private readonly eventStore: EventStore, private activator: EntityConstructor<T, U>, private snapshotStore: SnapshotEventStore, snapshotInterval: number = 1000) {
        this.genericRepo  = new GenericAggregateRootRepository(eventStore)
     }

    async get(id: UUID): Promise<EntityContainerPair<T,U>> {
        const [entity, aggregate] = await this.genericRepo.get(id, this.activator)
        return this.makeSnapshotPersistableEntity(aggregate, entity)
    }

    async find(id: UUID): Promise<EntityContainerPair<T,U> | undefined> {
        const aggregateSnapshot = await this.snapshotStore.getAggregateSnapshot(id)
        var aggregate = new AggregateContainer(this.activator)

        // Load snapshot
        aggregate.loadFromVersion(aggregateSnapshot.snapshots, aggregateSnapshot.changeVersion)

        // Load remaining events
        const remainingEvents = await loadEvents(this.eventStore, id, aggregate.changeVersion)
        aggregate.loadFromHistory(remainingEvents)

        if(aggregate.changeVersion <= 0) return undefined

        const [entity] = this.genericRepo.makePersistableEntity(aggregate)
        return this.makeSnapshotPersistableEntity(aggregate, entity)
    }

    async create(creationEvent: U): Promise<EntityContainerPair<T,U>> {
        const [entity, aggregate] = await this.genericRepo.create(this.activator, creationEvent)
        return this.makeSnapshotPersistableEntity(aggregate, entity)
    }


    private async makeSnapshotPersistableEntity(container: AggregateContainer<T,U>, entity: PersitableEntity<T>): Promise<EntityContainerPair<T,U>> {

        if(!isSnapshotableEntity(entity)) return [entity, container]

        const snapShotSave =  this.makeSnapshotSave(entity, container)
        const updatedentity = Object.assign(
            entity,
            {
                save: () => snapShotSave(100),
                uncommittedChanges: () => container.uncommittedChanges()
            }
        )

        return [updatedentity, container]
    }

    private makeSnapshotSave(entity: T & PersistableEntity, container: AggregateContainer<T,U>){
        const originalSave = entity.save.bind(entity)
        return async (snapshotLmit: number) : Promise<void> => {
            const count = await originalSave()
            if(count > snapshotLmit && isSnapshotableEntity(entity)){
                const snapshots = entity.snapshot(new Date().toISOString())
                this.snapshotStore.appendSnapshotEvents(entity.id, container.changeVersion, snapshots)
            }
        }
    }
}