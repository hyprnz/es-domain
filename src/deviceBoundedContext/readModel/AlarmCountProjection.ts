import * as Uuid from '../../eventSourcing/UUID'
import { makeProjection, Projection, StaticProjectionEventHandler } from '../../readModelRepository/Projection'
import {AlarmCreatedEvent} from "../events/internal/AlarmCreatedEvent";
import {AlarmDestroyedEvent} from "../events/internal/AlarmDestroyedEvent";

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

const defaultValue = (id: Uuid.UUID): AlarmCountProjection => ({
  id,
  version: 0,
  countOfAlarms: 0,
  countOfCurrentAlarms: 0
  // countOfDevices:0
})

const allAlarmCountProjectionId = Uuid.makeWelKnownUuid('d855f06c-89a2-4600-be96-2d86e9f0bff4')
export const allAlarmCountProjection = makeProjection<AlarmCountProjection>(
  'allAlarmCountProjection',
  eventHandlers,
  defaultValue,
  evt => allAlarmCountProjectionId
)
export const deviceAlarmCountProjection = makeProjection<AlarmCountProjection>(
  'deviceAlarmCountProjection',
  eventHandlers,
  defaultValue,
  evt => evt.aggregateRootId
)
