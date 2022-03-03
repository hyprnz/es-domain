import * as Uuid from '../../EventSourcing/UUID'
import { AlarmArmedEvent, AlarmCreatedEvent, AlarmDestroyedEvent } from "../events";
import { Projection, StaticProjectionEventHandler, makeProjection } from "../../EventSourcing/ReadModelTypes";
import { ChangeEvent } from '../../EventSourcing/EventSourcingTypes';

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
    AlarmArmedEvent.assertIsAlarmArmedEvent(evt)
    state.isActive = true,
    state.threshold = evt.payload.threshold
    return 'update'
  },
  [AlarmDestroyedEvent.eventType]: (state, evt) => { return 'delete' }
}

function idFactory (event: ChangeEvent): Uuid.UUID {
  if (AlarmCreatedEvent.isAlarmCreatedEvent(event)) return event.payload.alarmId
  return event.entityId
}

export const alarmProjectionHandler =  makeProjection<CurrentAlarmsProjection>('alarmProjectionHandler', eventHandlers, defaultValue, idFactory)
