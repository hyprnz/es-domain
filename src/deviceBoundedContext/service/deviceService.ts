import { Device } from "..";
import { AggregateContainer } from "../../EventSourcing/AggregateRoot";
import { ReadModelRepository } from "../../EventSourcing/ReadModelTypes";
import * as Uuid from "../../EventSourcing/UUID";
import { WriteModelRepositroy } from "../../WriteModelRepository/WriteModelRepositoryTypes";

export class DeviceService {
  constructor(private readRepo: ReadModelRepository, private writeRepo: WriteModelRepositroy) { }

  async addNewDeviceToNetwork(deviceId: Uuid.UUID, deviceName: string): Promise<void> {
    const aggregate = new AggregateContainer<Device>(      
      (p, id) => new Device(p, id),
      deviceId, 
    )

    this.writeRepo.save(aggregate)        
  }


}