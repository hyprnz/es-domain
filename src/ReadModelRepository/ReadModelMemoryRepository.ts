import { Projection, ReadModelRepository } from "../EventSourcing/ReadModelTypes";
import { UUID } from "../EventSourcing/UUID";

export class ReadModelMemoryRepository implements ReadModelRepository{
  private readonly store = new Map<UUID, string>()
  
  find<T extends Projection>(id: UUID): Promise<T | undefined> {
    const result = this.store.get(id)
    if(!result) return Promise.resolve(undefined)

    const row = JSON.parse(result) as T
    return Promise.resolve(row)
  }

  create<T extends Projection>(state: T): Promise<void> {
    this.store.set(state.id, JSON.stringify(state))
    return Promise.resolve()
  }
  update<T extends Projection>(state: T): Promise<void> {
    this.store.set(state.id, JSON.stringify(state))
    return Promise.resolve()
  }
  delete<T extends Projection>(state: T): Promise<void> {
    this.store.delete(state.id)
    return Promise.resolve()
  }
}