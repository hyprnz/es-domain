import { Projection, ReadModelRepository } from "../EventSourcing/ReadModelTypes";
import { UUID } from "../EventSourcing/UUID";

export class ReadModelMemoryRepository implements ReadModelRepository{
  private readonly store: Record<string, Map<UUID, string>> =  {}

  fetchProjectionStore(projectionName:string): Map<UUID, string> {
    const projection = this.store[projectionName]
    if(projection) return projection

    this.store[projectionName] = new Map<UUID, string>()
    return this.store[projectionName]
  }
  
  find<T extends Projection>(projectionName:string, id: UUID): Promise<T | undefined> {
    const projection = this.fetchProjectionStore(projectionName)
    const result = projection.get(id)
    if(!result) return Promise.resolve(undefined)

    const row = JSON.parse(result) as T
    return Promise.resolve(row)
  }

  create<T extends Projection>(projectionName:string, state: T): Promise<void> {
    const projection = this.fetchProjectionStore(projectionName)
    projection.set(state.id, JSON.stringify(state))
    return Promise.resolve()
  }
  update<T extends Projection>(projectionName:string, state: T): Promise<void> {
    const projection = this.fetchProjectionStore(projectionName)
    projection.set(state.id, JSON.stringify(state))
    return Promise.resolve()
  }
  delete<T extends Projection>(projectionName:string, state: T): Promise<void> {
    const projection = this.fetchProjectionStore(projectionName)
    if(projection) projection.delete(state.id)
    return Promise.resolve()
  }

  printAll(){
    Object.keys(this.store).forEach(key => {

      const store = this.fetchProjectionStore(key)
      const dataArray = Array.from(store.values()).map(element => JSON.parse(element));
      console.log({Projection:key, rows:dataArray})
    })
    
  }
}