export {
    EventStore,
    /** @deprecated Use EventStore instead */
    EventStore as InternalEventStore,
} from './EventStore'

export * from './WriteModelRepository'


export * from './AggregateRepository'
export * from './InMemoryEventStore'

// Snapshotting
export * from './SnapshotEventStore'
export * from './SnapshotRepository'
export * from './WriteModelSnapshotRepository'


export * from './OptimisticConcurrencyError'
export * from './WriteModelRepositoryError'
