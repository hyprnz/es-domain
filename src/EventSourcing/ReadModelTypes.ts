import * as Uuid from '../EventSourcing/UUID'
import { ChangeEvent, EntityEvent } from './EventSourcingTypes'

export interface Projection {  
  id: Uuid.UUID

  /** Version of most recently processed event */
  version: number
}

export type ProjectionAction = 'none'|'create'|'update'|'delete'
export type ProjectionRow<T extends Projection> =  {action:ProjectionAction, state:T}
export type StaticProjectionEventHandler<E> = (entity: E, evt: ChangeEvent) => ProjectionAction

export interface ReadModelRepository {
  find<T extends Projection>(id: Uuid.UUID): Promise<T|undefined>
  create<T extends Projection>(state: T): Promise<void>
  update<T extends Projection>(state: T): Promise<void>
  delete<T extends Projection>(state: T): Promise<void>
}

export function calculateNextAction(action: ProjectionAction, previousAction: ProjectionAction): ProjectionAction {
  if(action === 'delete') return 'delete'
  if(previousAction === 'create') return 'create'
  if(previousAction === 'none') return action
  return 'update'
}

export function persistReadModelState<T extends Projection>(repository: ReadModelRepository, records: Array<ProjectionRow<T>>): Promise<void> {
  const allPromises = records.map(row => {
    if(row.action === 'none') return Promise.resolve()
    if(row.action === 'delete') return repository.delete(row.state)
    if(row.action === 'update') return repository.update(row.state)
    // if(row.action === 'create') 
    return repository.create(row.state)
  })

  return Promise.all(allPromises).then()    
}


export function makeProjection<T extends Projection>(
  eventHandlers:  Record<string, StaticProjectionEventHandler<T>>, 
  defaultValue: (id:Uuid.UUID) => T)
: (events: Array<EntityEvent>, repository: ReadModelRepository) => Promise<void>{

  const projection = async (events: Array<EntityEvent>, repository: ReadModelRepository): Promise<void> => {
    const cache: Record<Uuid.UUID, ProjectionRow<T>> = {}
    
    for (var evt of events) {
      const handler = eventHandlers[evt.event.eventType]
      if (handler) {
        const id = evt.event.entityId

        if (!cache[id]) {
          const record = await repository.find<T>(id)
          cache[id] = record
            ? { action: 'none', state: record }
            : { action: 'create', state: defaultValue(id) }
        }

        const row = cache[id]
        const action = handler(row.state, evt.event)
        row.action = calculateNextAction(action, row.action)
        row.state.version = evt.version
      }
    }

    const rows = Object.values(cache)
    await persistReadModelState(repository, rows)    
  }

  return projection
}