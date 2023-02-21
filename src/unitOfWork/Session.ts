import { Aggregate } from '../eventSourcing'
import { EventStore } from '../eventSourcing/EventStore'

export interface UnitOfWorkParticipant {
  join(aggregate: Aggregate): Promise<void>
}

export interface UnitOfWork {
  complete(eventStore: EventStore): Promise<void>
  failed(): Promise<void>
}

/**
 * This is an experimental implementation of UnitOfWork pattern
 * This is not ready for use and should not be used yet.
 * I am still uncertain if this is needed. Currently event store is set up to store single AggregateRoots in a trnsactional manner
 * This would have meant the we would attempt to save multiple aggregate roots as a transaction
 * Typically in event sourced systems the Aggregate root is the unit of work as it writes to a single event stream
 * Updating multiple Aggregaes in a coordinated way is the job of a ProcessManager / Saga
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class Session {
  /** Begin a new session */
  public static async begin(eventStore: EventStore, uow: () => Promise<void>): Promise<void> {
    const session = await makeSession()
    try {
      await uow()
      await session.complete(eventStore)
    } catch (e) {
      await session.failed()
      throw e
    }
  }

  /** Join the session */
  static async join(aggregate: Aggregate): Promise<void> {
    const session = await makeSession()
    await session.join(aggregate)
  }
}

class InMemorySession implements UnitOfWork, UnitOfWorkParticipant {
  readonly sessionAggregates: Array<Aggregate> = []
  async complete(eventStore: EventStore): Promise<void> {
    const events = this.sessionAggregates.flatMap(x => x.uncommittedChanges())
    // TODO : Save all events
    // Will this achieve what we need as event persitence is only transactional per partition
    // Have added tests in Dynamo and Tablestorage event store repos,
    // Tables storage transactions cannot span partitions
    // Dynamo Transactions can (tested in localstack)
    await eventStore.appendEvents('some-inmemory-session-id', 0, events)

    this.sessionAggregates.forEach(a => a.markChangesAsCommitted())
  }

  failed(): Promise<void> {
    while (this.sessionAggregates.length) this.sessionAggregates.pop()
    return Promise.resolve()
  }

  join(aggregate: Aggregate): Promise<void> {
    this.sessionAggregates.push(aggregate)
    return Promise.resolve()
  }
}

function makeSession(): Promise<UnitOfWorkParticipant & UnitOfWork> {
  return Promise.resolve(sessionSingleton)
}

const sessionSingleton = new InMemorySession()
