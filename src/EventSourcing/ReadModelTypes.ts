import * as Uuid from '../EventSourcing/UUID'
import { ChangeEvent } from './EventSourcingTypes'

export interface IProjection {
  id: Uuid.UUID
  version: number
}

export type ProjectionAction = 'none'|'create'|'update'|'delete'
export type ProjectionRow<T extends IProjection> =  {action:ProjectionAction, state:T}
export type StaticProjectionEventHandler<E> = (entity: E, evt: ChangeEvent) => ProjectionAction

export interface IReadModelRepository<T extends IProjection> {
  find(id: Uuid.UUID): Promise<T|undefined>
  create(state: T): Promise<void>
  update(state: T): Promise<void>
  delete(state: T): Promise<void>
}

export function calculateNextAction(action: ProjectionAction, previousAction: ProjectionAction): ProjectionAction {
  if(action === 'delete') return 'delete'
  if(previousAction === 'create') return 'create'
  if(previousAction === 'none') return action
  return 'update'
}

export function persistReadModelState<T extends IProjection>(repository: IReadModelRepository<T>, records: Array<ProjectionRow<T>>): Promise<void> {
  const allPromises = records.map(row => {
    if(row.action === 'none') return Promise.resolve()
    if(row.action === 'delete') return repository.delete(row.state)
    if(row.action === 'update') return repository.update(row.state)
    // if(row.action === 'create') 
    return repository.create(row.state)
  })

  return Promise.all(allPromises).then()    
}

