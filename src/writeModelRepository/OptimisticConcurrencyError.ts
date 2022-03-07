export class OptimisticConcurrencyError extends Error {
    constructor(id: string, actualVersion: number) {
        super(`Optimistic concurrency error for aggregate root id: ${id}, version: ${actualVersion}`);
    }
}