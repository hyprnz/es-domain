import {UUID} from "../eventSourcing/UUID";

export class OptimisticConcurrencyError extends Error {
    constructor(id: UUID, committedVersion: number, firstUncommittedChangeVersion: number) {
        super(`Optimistic concurrency error for aggregate root id: ${id}, expected event version:${committedVersion} but received ${firstUncommittedChangeVersion}, Suggested solution is to retry`);
    }
}