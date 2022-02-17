import * as Uuid from '../EventSourcing/UUID'
import { AlarmCreatedEvent, AlarmDestroyedEvent } from '../deviceBoundedContext/events/deviceEvents'
import { ChangeEvent, StaticEventHandler } from '../EventSourcing/EventSourcingTypes'
import { calculateNextAction, IProjection, IReadModelRepository, ProjectionRow, StaticProjectionEventHandler } from '../EventSourcing/ReadModelTypes'

export interface IAlarmCount extends IProjection {
  /** Count of all devices that have ever been */
  countOfAlarms: number

  /** Count of current devices */
  countOfCurrentAlarms: number  
}

export async function handleEvents(events: Array<ChangeEvent>, repository: IReadModelRepository<IAlarmCount>): Promise<void> {
  const cache: Record<Uuid.UUID, ProjectionRow<IAlarmCount>> = {}

  await events.forEach(async (evt) => {
    const handler = eventHandlers[evt.eventType]
    if (handler) {
      const id = evt.entityId

      if (!cache[id]) {
        const record = await repository.find(id)
        cache[id] = record
          ? { action: 'none', state: record }
          : { action: 'create', state: { id, version: 0, countOfAlarms:0, countOfCurrentAlarms:0 } }
      }

      const row = cache[id]
      const action = handler(row.state, evt)
      row.action = calculateNextAction(action, row.action)
    }
  })
  
const eventHandlers: Record<string, StaticProjectionEventHandler<IAlarmCount>> = {
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
}