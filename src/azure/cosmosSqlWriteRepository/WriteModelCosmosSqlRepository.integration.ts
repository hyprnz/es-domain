import { assertThat, match } from 'mismatched'
import { CosmosClient, CosmosClientOptions } from '@azure/cosmos'
import { WriteModelCosmosSqlRepository } from './WriteModelCosmosSqlRepository'

import * as Uuid from '../../eventSourcing/UUID'
import { makeMigrator } from './migrate'
import { EntityEvent } from '../../eventSourcing/MessageTypes'
import { DeviceAggregate } from '../../deviceBoundedContext/domain/DeviceAggregate'

describe('WriteModelCosmosSqlRepository', () => {
  let writeModelRepo: WriteModelCosmosSqlRepository
  beforeAll(async () => {
    const databaseId = 'testdb'
    const containerName = 'eventstore'

    const options: CosmosClientOptions = { endpoint: 'localhost', key: 'some-key' }
    const client = new CosmosClient(options)

    const migrate = makeMigrator(client, databaseId, containerName)
    await migrate.up()

    const database = client.database(databaseId)
    const container = database.container(containerName)

    writeModelRepo = new WriteModelCosmosSqlRepository(container)
  })

  it('stores events', async () => {
    const deviceId = Uuid.createV4()
    const alarmId = Uuid.createV4()

    const deviceAggregate = new DeviceAggregate().withDevice(deviceId)
    deviceAggregate.addAlarm(alarmId)

    const uncommittedEvents = deviceAggregate.uncommittedChanges()

    const emittedEvents: Array<EntityEvent> = []
    writeModelRepo.subscribeToChangesSynchronously(changes => changes.forEach(x => emittedEvents.push(x)))

    const countEvents = await writeModelRepo.save(deviceAggregate)

    assertThat(countEvents).withMessage('Stored Event count').is(2)
    assertThat(emittedEvents).withMessage('Emitted Events').is(match.array.length(2))
    assertThat(uncommittedEvents).is(emittedEvents)
  })

  it('loads events', async () => {
    const deviceId = Uuid.createV4()
    const alarmId = Uuid.createV4()

    const deviceAggregate = new DeviceAggregate().withDevice(deviceId)
    deviceAggregate.addAlarm(alarmId)

    const uncomittedEvents = deviceAggregate.uncommittedChanges()
    await writeModelRepo.save(deviceAggregate)

    // Compare Saved event to loaded make sure they are the same
    const loadedEvents = await writeModelRepo.loadEvents(deviceId)

    assertThat(loadedEvents).is(match.array.length(2))
    assertThat(uncomittedEvents).is(loadedEvents)
  })

  it('detects concurrency', async () => {
    const deviceId = Uuid.createV4()
    const alarmId = Uuid.createV4()

    const deviceAggregate = new DeviceAggregate().withDevice(deviceId)
    deviceAggregate.addAlarm(alarmId)
    await writeModelRepo.save(deviceAggregate)

    const anotherDeviceAggregate = await writeModelRepo.load(deviceId, new DeviceAggregate())

    // Make changes to both
    deviceAggregate.addAlarm(Uuid.createV4())
    anotherDeviceAggregate.addAlarm(Uuid.createV4())

    assertThat(deviceAggregate.changeVersion).withMessage('deviceAggregate version').is(1)
    assertThat(anotherDeviceAggregate.changeVersion).withMessage('anotherDeviceAggregate version').is(1)

    assertThat(deviceAggregate.uncommittedChanges()).is(match.array.length(1))
    assertThat(anotherDeviceAggregate.uncommittedChanges()).is(match.array.length(1))

    assertThat(deviceAggregate.uncommittedChanges()[0].version).withMessage('UnCommited device').is(2)
    assertThat(anotherDeviceAggregate.uncommittedChanges()[0].version).withMessage('UnCommited anotherDevice').is(2)

    assertThat(deviceAggregate.uncommittedChanges()[0].event.aggregateRootId).withMessage('UnCommited device').is(deviceId)
    assertThat(anotherDeviceAggregate.uncommittedChanges()[0].event.aggregateRootId).withMessage('UnCommited anotherDevice').is(deviceId)

    await writeModelRepo.save(deviceAggregate)
    await writeModelRepo.save(anotherDeviceAggregate).then(
      () => {
        throw new Error('Expected and Optimistic concurrency error here!!')
      },
      e => assertThat(e.message).is(`Error:AggregateRoot, Optimistic concurrency error detected, Suggested solution is to retry`)
    )
  })
})
