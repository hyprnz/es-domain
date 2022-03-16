import * as Uuid from '../../eventSourcing/UUID'
import { AlarmArmedEvent, AlarmCreatedEvent, AlarmDestroyedEvent } from "../events/internal/DeviceEvents";
import { Projection, StaticProjectionEventHandler, makeProjection } from "../../readModelRepository/Projection";

export interface CurrentAlarmsProjection extends Projection {
  /** Is alarm active */
  isActive: boolean

  /** Alarm threshold */
  threshold: number
}

const defaultValue =  (id: Uuid.UUID): CurrentAlarmsProjection => ( { id, version: 0, isActive: false, threshold: 0 }) 
const eventHandlers: Record<string, StaticProjectionEventHandler<CurrentAlarmsProjection>> = {
  [AlarmCreatedEvent.eventType]: (state, evt) => { state.isActive = false; return 'update' },
  [AlarmArmedEvent.eventType]: (state, evt) => {
    AlarmArmedEvent.assertAlarmArmedEvent(evt)
    state.isActive = true,
    state.threshold = evt.threshold
    return 'update'
  },
  [AlarmDestroyedEvent.eventType]: (state, evt) => { return 'delete' }
}



export const alarmProjectionHandler =  makeProjection<CurrentAlarmsProjection>('alarmProjectionHandler', eventHandlers, defaultValue)
