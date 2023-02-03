// import { makeNoOpLogger } from '../util/Logger'
// import { UUID } from '../util/UUID'
// import { ChangeEvent, EntityEvent } from '../eventSourcing/MessageTypes'
// import { WriteModelRepository } from './WriteModelRepository'
// import { Aggregate } from '../eventSourcing/Aggregate'
// import { EventStoreRepository } from './EventStoreRepository'
// import { EventBus } from './EventBus'
// import { AggregateContainer, Entity, EntityBase, EntityConstructor, EntityConstructorPayload } from '../eventSourcing'

// type EventMiddleware = (evt: ChangeEvent) => Promise<ChangeEvent>
// type EventDeserializer = Record<string, EventMiddleware | undefined>

// export class AggregateRootRepositoryBuilder {
//   static make(eventRepository: EventStoreRepository, bus:EventBus<EntityEvent>): WriteModelRepository{
//     return new AggregateFactoryImplementation(eventRepository, bus)
//   }
// }

// class AggregateFactoryImplementation implements WriteModelRepository {
//   private eventMiddleware: EventDeserializer = {}

//   constructor(private readonly eventStore: EventStoreRepository, private readonly bus:EventBus<EntityEvent>) { }


//   addEventPostProcessor(eventType: string, handler: EventMiddleware, appendIfExists: boolean = false): void {
//     const existingHandler = this.eventMiddleware[eventType]

//     if (existingHandler) {
//       if (appendIfExists) {
//         this.eventMiddleware[eventType] = (e) => existingHandler(e).then(handler)
//         return
//       }
//       throw new Error(`Handler for eventType:${eventType} already registered`)
//     }


//     this.eventMiddleware[eventType] = handler
//   }

//   private async callEventMiddleware(event: EntityEvent): Promise<EntityEvent> {
//     const { eventType } = event.event
//     const middleware = this.eventMiddleware[eventType];

//     return ({
//       version: event.version,
//       event:  middleware ? await middleware(event.event) : event.event
//     })
//   }


//   async save<T extends Aggregate>(aggregate: T): Promise<number> {
//     const changes = aggregate.uncommittedChanges()
//     if (changes.length === 0) {
//       return Promise.resolve(0)
//     }
//     await this.eventStore.appendEvents(aggregate.id, changes[0].version, changes)
//     aggregate.markChangesAsCommitted(changes[changes.length - 1].version)
//     await this.onAfterEventsStored(changes)
//     return changes.length
//   }

//   async load<T extends Aggregate>(id: UUID, aggregate: T): Promise<T> {
//     const events = await this.loadEvents(id)
//     aggregate.loadFromHistory(events)
//     return aggregate
//   }




//   /** This method is mainly provider for test purposes, so that we can inspect persisted events */
//   loadEvents(id: UUID): Promise<Array<EntityEvent>> {
//     return this.eventStore.getEvents(id)
//       .then(rawEvents => rawEvents.map(x =>this.callEventMiddleware(x)))
//       .then(x => Promise.all(x))

//   }

//   async loadAfterVersion<T extends Aggregate>(id: UUID, aggregate: T, version: number): Promise<T> {
//     const events = await this.eventStore.getEventsAfterVersion(id, version)

//     //BLAIR : Why would be ever need to do this ? If it is related to snapshots the snapshot should set the version and then we load
//     // aggregate.changeVersion = version
//     aggregate.loadFromHistory(events)
//     return aggregate
//   }

//   subscribeToChangesSynchronously(handler: (changes: Array<EntityEvent>) => Promise<void>) {
//     this.bus.registerHandlerForEvents(handler)
//   }

//   private async onAfterEventsStored(changes: Array<EntityEvent>): Promise<void> {
//     if (changes.length === 0) return
//     await this.bus.callHandlers(changes)
//   }
// }