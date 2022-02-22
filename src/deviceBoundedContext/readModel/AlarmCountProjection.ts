import * as Uuid from '../../EventSourcing/UUID'
import { AlarmCreatedEvent, AlarmDestroyedEvent } from '../events/deviceEvents'
import { ChangeEvent, EntityEvent, StaticEventHandler } from '../../EventSourcing/EventSourcingTypes'
import { calculateNextAction, Projection, ReadModelRepository, ProjectionRow, StaticProjectionEventHandler, persistReadModelState } from '../../EventSourcing/ReadModelTypes'

export interface AlarmCountProjection extends Projection {
  /** Count of all devices that have ever been */
  countOfAlarms: number

  /** Count of current devices */
  countOfCurrentAlarms: number  

  // countOfDevices: number
}

const eventHandlers: Record<string, StaticProjectionEventHandler<AlarmCountProjection>> = {
  [AlarmCreatedEvent.eventType]: (state, evt) => { 
    state.countOfAlarms++
    state.countOfCurrentAlarms++
    return 'update'
  },
  [AlarmDestroyedEvent.eventType]: (state, evt) => { 
    state.countOfCurrentAlarms--
    return 'update'
  }
}

const defaultValue =  (id: Uuid.UUID): AlarmCountProjection => ({ 
  id, 
  version: 0, 
  countOfAlarms:0, 
  countOfCurrentAlarms:0, 
  // countOfDevices:0 
}) 


export async function alarmCountProjection(events: Array<EntityEvent>, repository: ReadModelRepository): Promise<void> {
  const cache: Record<Uuid.UUID, ProjectionRow<AlarmCountProjection>> = {}

  await events.forEach(async (evt) => {
    const handler = eventHandlers[evt.event.eventType]
    if (handler) {
      const id = evt.event.entityId

      if (!cache[id]) {
        const record = await repository.find<AlarmCountProjection>(id)
        cache[id] = record
          ? { action: 'none', state: record }
          : { action: 'create', state: defaultValue(id) }
      }

      const row = cache[id]
      const action = handler(row.state, evt.event)
      row.action = calculateNextAction(action, row.action)
    }
  })
  
  const rows = Object.values(cache)
  await persistReadModelState(repository, rows)
  return Promise.resolve()
}