import * as Uuid from '../../util/UUID'
import { makeProjection, Projection, StaticProjectionEventHandler } from '../../readModelRepository/Projection'
import { AlarmCreatedEvent } from '../events/internal/AlarmCreatedEvent'
import { AlarmArmedEvent } from '../events/internal/AlarmArmedEvent'
import { AlarmDestroyedEvent } from '../events/internal/AlarmDestroyedEvent'

export interface CurrentAlarmsProjection extends Projection {
  /** Is alarm active */
  isActive: boolean

  /** Alarm threshold */
  threshold: number
}

const initialValue = (id: Uuid.UUID): CurrentAlarmsProjection => ({ id, version: 0, isActive: false, threshold: 0 })
const eventHandlers: Record<string, StaticProjectionEventHandler<CurrentAlarmsProjection>> = {
  [AlarmCreatedEvent.eventType]: (state, evt) => {
    state.isActive = false
    return 'update'
  },
  [AlarmArmedEvent.eventType]: (state, evt) => {
    AlarmArmedEvent.assertAlarmArmedEvent(evt)
    state.isActive = true
    state.threshold = evt.threshold
    return 'update'
  },
  [AlarmDestroyedEvent.eventType]: (state, evt) => {
    return 'delete'
  }
}

export const alarmProjectionHandler = makeProjection<CurrentAlarmsProjection>(
  'alarmProjectionHandler',
  eventHandlers,
  initialValue
)
