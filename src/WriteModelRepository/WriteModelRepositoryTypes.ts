import { IAggregateRoot } from "../EventSourcing/EventSourcingTypes";
import { UUID } from "../EventSourcing/UUID";

export interface IWriteModelRepositroy {
  save<T extends IAggregateRoot>(aggregateRoot: T) : Promise<number>
  load<T extends IAggregateRoot>(id: UUID, activator: () => T) : T
}