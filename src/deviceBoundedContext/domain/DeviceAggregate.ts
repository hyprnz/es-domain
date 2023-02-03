import { Alarm, Device } from '..'
import * as Uuid from '../../util/UUID'
import { UUID } from '../../util/UUID'
import { AggregateContainer } from '../../eventSourcing/AggregateContainer'
import { ChangeEvent, EntityEvent } from '../../eventSourcing/MessageTypes'
import { Aggregate, SnapshotAggregate } from '../../eventSourcing/Aggregate'
import { DeviceCreationParmaters } from './Device'

// BJ I think thi is a bad use of the aggregate container, this wraps the aggrgate container unnecesarily
// We seperated the Aggregate container and aggregate root intentionally as people preffered composition over inheritiance
// These types of classes (more oop) are attempting to bring these 2 things back togeather so they can be accessed as one
// However this introduces A LOT of unnecesary boiler plate code !!!!!

/** @deprecated
 * This is an example of an Aggregate Root that uses composition to inject the aggregate container and then all the properties
 * and methods of the container are exposed
 *
 * BJ I think thi is a bad use of the aggregate container, this wraps the aggrgate container unnecesarily
 * We seperated the Aggregate container and aggregate root intentionally as people preffered composition over inheritiance
 * These types of classes (more oop) are attempting to bring these 2 things back togeather so they can be accessed as one
 * However this introduces A LOT of unnecesary boiler plate code !!!!!
 *
 * Aggregate
 * Use Non inherited version where
 * */
export class DeviceAggregate implements SnapshotAggregate {
  constructor(private aggregate: AggregateContainer<Device, DeviceCreationParmaters> = new AggregateContainer(Device)) {}

  private get root(): Device {
    return this.aggregate.rootEntity
  }

  get changeVersion(): number {
    return this.aggregate.changeVersion
  }

  get id(): UUID {
    return this.aggregate.id
  }

  snapshot(): ChangeEvent[] {
    return this.aggregate.rootEntity.snapshot(this.aggregate.latestDateTimeFromEvents())
  }

  markChangesAsCommitted(version: number): void {
    this.aggregate.markChangesAsCommitted(version)
  }

  uncommittedChanges(): Array<EntityEvent> {
    return this.aggregate.uncommittedChanges()
  }

  withDevice(id: Uuid.UUID, colour: string): this {
    this.aggregate.createNewAggregateRoot({ id, colour })
    return this
  }

  loadFromHistory(history: EntityEvent[]): void {
    this.aggregate.loadFromHistory(history)
  }

  loadFromVersion(changeEvents: ChangeEvent[], version: number): void {
    this.aggregate.loadFromVersion(changeEvents, version)
  }

  addAlarm(alarmId: Uuid.UUID): Alarm {
    return this.root.addAlarm(alarmId)
  }

  destroyAlarm(alarmId: Uuid.UUID): void {
    const alarm = this.root.findAlarm(alarmId)
    if (alarm) this.root.destroyAlarm(alarm)
  }

  maybeTriggerAlarm(alarmId: Uuid.UUID): boolean {
    const alarm = this.root.findAlarm(alarmId)
    if (!alarm) {
      return false
    }
    return alarm.maybeTrigger(10)
  }

  findAlarm(alarmId: Uuid.UUID): Alarm | undefined {
    return this.root.findAlarm(alarmId)
  }

  telemetryReceived(value: number): void {
    return this.root.telemetryReceived(value)
  }

  countOfEvents(): number {
    return this.aggregate.countOfEvents()
  }
}
