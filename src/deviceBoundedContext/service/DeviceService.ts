import { Device } from '..'
import { AggregateRepository } from '../../eventSourcing/AggregateRootRepo'
import * as Uuid from '../../util/UUID'
import { DeviceCreationParmaters } from '../domain/Device'

export class DeviceService {
  constructor(private repository: AggregateRepository<Device, DeviceCreationParmaters>) {}

  async addNewDeviceToNetwork(deviceId: Uuid.UUID): Promise<void> {
    const [device] = await this.repository.create({id:deviceId, colour:"red"})
    await device.save()
  }

  async addDeviceAlarm(deviceId: Uuid.UUID, alarmId: Uuid.UUID): Promise<void> {
    const [aggregate] = await this.repository.get(deviceId)
    aggregate.addAlarm(alarmId)
    await aggregate.save()
  }

  async removeDeviceAlarm(deviceId: Uuid.UUID, alarmId: Uuid.UUID): Promise<void> {
    const [aggregate] = await this.repository.get(deviceId)
    const alarm = aggregate.findAlarm(alarmId)
    if(alarm) {
      aggregate.destroyAlarm(alarm)
      await aggregate.save()
    }
  }

  async triggerAlarm(deviceId: Uuid.UUID, alarmId: Uuid.UUID) : Promise<boolean> {
    const [aggregate] = await this.repository.get(deviceId)
    const alarm = aggregate.findAlarm(alarmId)
    if (!alarm) return false
    const triggered = alarm.maybeTrigger(10)
    await aggregate.save()

    return triggered
  }
}
