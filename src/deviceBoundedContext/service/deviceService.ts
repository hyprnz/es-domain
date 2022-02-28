import { Device } from "..";
import { Aggregate } from "../../EventSourcing/Aggregate";
import { UUID } from "../../EventSourcing/UUID";
import { WriteModelRepository } from "../../WriteModelRepository/WriteModelRepositoryTypes";

export class DeviceService {
  constructor(private writeRepo: WriteModelRepository) { }

  private static deviceAggregateFactory = (deviceId: UUID)=> new Aggregate<Device>(      
    deviceId, 
    (id, parentAggregate) => new Device(parentAggregate, id),
  )

  async addNewDeviceToNetwork(deviceId: UUID): Promise<void> {
    const deviceAggregate = DeviceService.deviceAggregateFactory(deviceId) 
    deviceAggregate.rootEntity.initialise()
    await this.writeRepo.save(deviceAggregate)        
  }

  async addDeviceAlarm(deviceId: UUID, alarmId: UUID): Promise<void> {

    const aggregate = await this.writeRepo.load(deviceId, DeviceService.deviceAggregateFactory)
    aggregate.rootEntity.addAlarm(alarmId)
    await this.writeRepo.save(aggregate)        
  }
 
  async removeDeviceAlarm(deviceId: UUID, alarmId: UUID): Promise<void> {
    const aggregate = await this.writeRepo.load(deviceId, DeviceService.deviceAggregateFactory)
    
    const alarm = aggregate.rootEntity.findAlarm(alarmId)
    if(alarm) aggregate.rootEntity.destroyAlarm(alarm)
    await this.writeRepo.save(aggregate)        
  }

}