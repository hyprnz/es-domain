export {
    EventStoreRepository,
    /** @deprecated Use EventStore instead */
    EventStoreRepository as InternalEventStore,
} from './EventStoreRepository'

export * from './WriteModelRepository'



export * from './InMemoryEventStore'

// Snapshotting
export * from './SnapshotEventStore'
export * from './SnapshotRepository'
export * from './WriteModelSnapshotRepository'


export * from './OptimisticConcurrencyError'
export * from './WriteModelRepositoryError'
