import {assertThat, match} from 'mismatched'
import {Device} from '..'
import * as deviceEvents from "../events/internal/DeviceEvents"
import {AggregateContainer} from '../../eventSourcing/AggregateContainer'
import {ChangeEvent, EntityEvent, UNINITIALISED_AGGREGATE_VERSION} from '../../eventSourcing/MessageTypes'
import * as Uuid from '../../eventSourcing/UUID'
import {Entity} from "../../eventSourcing/Entity";
import {Aggregate} from "../../eventSourcing/Aggregate";
import {DeviceAggregate} from "./DeviceAggregate";

describe('Device', () => {
    describe('GenericAggregateRoot', () => {
        describe('Event Sourceing Basics', () => {
            it('Uninitilaised', () => {
                const aggregate = new DeviceAggregate()
                assertThat(aggregate.uncommittedChanges()).is([])
                assertThat(aggregate.changeVersion).is(UNINITIALISED_AGGREGATE_VERSION)
            })

            it('Create New Device', () => {
                const id = Uuid.createV4()
                const aggregate = new DeviceAggregate().withDevice(id)
                const events = aggregate.uncommittedChanges()
                assertThat(events).is([
                    makeEntityEventMatcher(new deviceEvents.DeviceCreatedEvent(id, id), 0)
                ])
                assertThat(aggregate.changeVersion).is(UNINITIALISED_AGGREGATE_VERSION)
            })

            it('Load from History', () => {
                const aggregate = new DeviceAggregate()
                const id = Uuid.createV4()
                const history = [{event: new deviceEvents.DeviceCreatedEvent(id, id), version: 0}]
                aggregate.loadFromHistory(history)
                assertThat(aggregate.id).is(id)
                assertThat(aggregate.changeVersion).is(0)

                assertThat(aggregate.rootEntity.id).is(aggregate.id)
            })
        })

        describe('Child Entities', () => {
            it('Create Child Entity', () => {
                const deviceId = Uuid.createV4()
                const alarmId = Uuid.createV4()
                const aggregate = new DeviceAggregate().withDevice(deviceId) //+1
                // const device = new DeviceAggregateRoot(deviceId) //+1 Event
                const device = aggregate.rootEntity
                const alarm = device.addAlarm(alarmId) //+1 Event
                alarm.armAlarm(20) //+1 Event

                const events = aggregate.uncommittedChanges()
                aggregate.markChangesAsCommitted(events.length - 1)

                assertThat(events).is(match.array.length(3))
                assertThat(events).is([
                    makeEntityEventMatcher(new deviceEvents.DeviceCreatedEvent(deviceId, deviceId), 0),
                    makeEntityEventMatcher(new deviceEvents.AlarmCreatedEvent(deviceId, alarmId), 1),
                    makeEntityEventMatcher(new deviceEvents.AlarmArmedEvent(deviceId, alarmId, {threshold: 20}), 2),
                ])

                const hydratedAggregate = new DeviceAggregate()
                hydratedAggregate.loadFromHistory(events)
                assertThat(hydratedAggregate).is(makeEntityMatcher(device))

                hydratedAggregate.rootEntity.telemetryReceived(21)
                const uncommitted = hydratedAggregate.uncommittedChanges()
                assertThat(uncommitted).is([
                    makeEntityEventMatcher(new deviceEvents.AlarmTriggeredEvent(hydratedAggregate.id, alarm.id), 3)
                ])
            })

            it('Destroy child Entity', () => {
                const deviceId = Uuid.createV4()
                const alarmId = Uuid.createV4()
                const aggregate = new DeviceAggregate().withDevice(deviceId) //+1
                const device = aggregate.rootEntity
                const alarm = device.addAlarm(alarmId) //+1 Event
                assertThat(device.findAlarm(alarm.id)).isNot(undefined)

                const lastChange = aggregate.uncommittedChanges()
                aggregate.markChangesAsCommitted(lastChange.length)


                device.destroyAlarm(alarm) //+1
                assertThat(device.findAlarm(alarm.id)).is(undefined)
                assertThat(aggregate.uncommittedChanges().map(x => x.event))
                    .is([makeEventMatcher(new deviceEvents.AlarmDestroyedEvent(aggregate.id, alarm.id))])
            })

        })
    })

    const makeEventMatcher = <T extends ChangeEvent>(event: T): ChangeEvent => {
        return {...event, id: match.any(), causationId: match.any(), correlationId: match.any()}
    }
    const makeEntityEventMatcher = <T extends ChangeEvent>(event: T, version: number = UNINITIALISED_AGGREGATE_VERSION): EntityEvent => {
        return {event: makeEventMatcher(event), version}
    }

    const makeEntityMatcher = (entity: Entity | Aggregate) => match.obj.has({id: entity.id})
})