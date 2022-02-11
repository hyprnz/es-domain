import * as Uuid from '../EventSourcing/UUID'
import { AlarmArmedEvent, AlarmCreatedEvent, AlarmDestroyedEvent } from "../deviceBoundedContext/events/deviceEvents";
import { IEntityEvent } from "../EventSourcing/EventSourcingTypes";
import { calculateNextAction, IProjection, IReadModelRepository, persistReadModelState, ProjectionRow, StaticProjectionEventHandler } from "../EventSourcing/ReadModelTypes";

export interface IAlarm extends IProjection {
  /** Is alarm active */
  isActive: boolean

  /** Alarm threshold */
  threshold: number
}

export async function handleEvents(events: Array<IEntityEvent>, repository: IReadModelRepository<IAlarm>): Promise<Array<ProjectionRow<IAlarm>>> {
  const cache: Record<Uuid.UUID, ProjectionRow<IAlarm>> = {}
  for (var evt of events) {
    const handler = eventHandlers[evt.event.eventType]
    if (handler) {
      const id = evt.event.entityId

      if (!cache[id]) {
        const record = await repository.find(id)
        cache[id] = record
          ? { action: 'none', state: record }
          : { action: 'create', state: { id, version: evt.version, isActive: false, threshold: 0 } }
      }

      const row = cache[id]
      const action = handler(row.state, evt.event)
      row.action = calculateNextAction(action, row.action)
      row.state.version = evt.version
    }
  }

  const rows = Object.values(cache)
  await persistReadModelState(repository, rows)
  return rows
}

const eventHandlers: Record<string, StaticProjectionEventHandler<IAlarm>> = {
  [AlarmCreatedEvent.eventType]: (state, evt) => { state.isActive = false; return 'update' },
  [AlarmArmedEvent.eventType]: (state, evt) => {
    AlarmArmedEvent.assertIsAlarmArmedEvent(evt)
    state.isActive = true,
    state.threshold = evt.threshold
    return 'update'
  },
  [AlarmDestroyedEvent.eventType]: (state, evt) => { return 'delete' }
}
