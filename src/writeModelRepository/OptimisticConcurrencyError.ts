export class OptimisticConcurrencyError extends Error {
    constructor(id: string, version: number|string) {
        super(`Optimistic concurrency error for aggregate root id: ${id}, version: ${version}`);
    }
}