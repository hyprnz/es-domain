import { Alarm, Device } from '..'
import * as Uuid from '../../eventSourcing/UUID'
import { UUID } from '../../eventSourcing/UUID'
import { AggregateContainer } from '../../eventSourcing/AggregateContainer'
import { ChangeEvent, EntityEvent } from '../../eventSourcing/MessageTypes'
import { Aggregate, SnapshotAggregate } from '../../eventSourcing/Aggregate'
import { DeviceCreatedEvent } from '../events/internal/DeviceCreatedEvent'

export class DeviceAggregate implements Aggregate, SnapshotAggregate {
  constructor(
    private aggregate: AggregateContainer<Device> = new AggregateContainer<Device>(
      () => new Device((evt, isSnapshot) => this.aggregate.observe(evt, isSnapshot))
    )
  ) {}

  uncommittedSnapshots(): ChangeEvent[] {
    return this.aggregate.uncommittedSnapshots()
  }

  private get root(): Device {
    return this.aggregate.rootEntity
  }

  get changeVersion(): number {
    return this.aggregate.changeVersion
  }

  get id(): UUID {
    return this.aggregate.id
  }

  snapshot(): void {
    this.aggregate.rootEntity.snapshot(this.aggregate.latestDateTimeFromEvents())
  }

  markChangesAsCommitted(version: number): void {
    this.aggregate.markChangesAsCommitted(version)
  }

  uncommittedChanges(): Array<EntityEvent> {
    return this.aggregate.uncommittedChanges()
  }

  withDevice(id: Uuid.UUID): this {
    this.root.applyChangeEvent(DeviceCreatedEvent.make(Uuid.createV4, { deviceId: id }))
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

  markSnapshotsAsCommitted(): void {
    this.aggregate.markSnapshotsAsCommitted()
  }

  countOfEvents(): number {
    return this.aggregate.countOfEvents()
  }
}
