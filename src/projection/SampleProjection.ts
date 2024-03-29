import { ChangeEvent, EntityEvent, Projection, ReadModelRepository } from '..'
import { UUID } from '../util/UUID'

export type ProjectionAction = 'none' | 'create' | 'update' | 'delete'
export type ProjectionRow<T extends Projection> = { action: ProjectionAction; state: T }
export type StaticProjectionEventHandler<E> = (entity: E, evt: ChangeEvent) => ProjectionAction

export function calculateNextAction(action: ProjectionAction, previousAction: ProjectionAction): ProjectionAction {
  if (action === 'delete') return 'delete'
  if (previousAction === 'create') return 'create'
  if (previousAction === 'none') return action
  return 'update'
}

export function persistReadModelState<T extends Projection>(
  projectionName: string,
  repository: ReadModelRepository,
  records: Array<ProjectionRow<T>>
): Promise<void> {
  const allPromises = records.map(row => {
    // console.log(`Performing Action:${row.action} on Projection: id:${row.state.id}, version:${row.state.version}`)
    if (row.action === 'none') return Promise.resolve()
    if (row.action === 'delete') return repository.delete(projectionName, row.state)
    if (row.action === 'update') return repository.update(projectionName, row.state)
    // if(row.action === 'create')
    return repository.create(projectionName, row.state)
  })

  return Promise.all(allPromises).then()
}

export function makeProjection<T extends Projection>(
  projectionName: string,
  eventHandlers: Record<string, StaticProjectionEventHandler<T>>,
  initialValue: (id: UUID) => T,
  idFactory?: (evt: ChangeEvent) => UUID
): (events: Array<EntityEvent>, repository: ReadModelRepository) => Promise<void> {
  const projection = async (events: Array<EntityEvent>, repository: ReadModelRepository): Promise<void> => {
    const localCache: Record<string, ProjectionRow<T>> = {}

    for (const evt of events) {
      const handler = eventHandlers[evt.event.eventType]
      if (handler) {
        const id = idFactory ? idFactory(evt.event) : evt.event.entityId

        if (!localCache[id]) {
          const record = await repository.find<T>(projectionName, id)
          localCache[id] = record ? { action: 'none', state: record } : { action: 'create', state: initialValue(id) }
        }

        const row = localCache[id]
        const action = handler(row.state, evt.event)
        row.action = calculateNextAction(action, row.action)
        if (evt.version > row.state.version) row.state.version = evt.version
      }
    }

    const rows = Object.values(localCache)
    await persistReadModelState(projectionName, repository, rows)
  }

  return projection
}
