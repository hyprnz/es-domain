import * as Uuid from '../eventSourcing/UUID'
import { AggregateRepository } from './AggregateRepository'
import { AggregateSnapshotRepository } from './AggregateSnapshotRepository'
import { SnapshotRepository } from './SnapshotRepository'
import { TestAggregate } from '../eventSourcing/TestAggregate'
import { Thespian, TMocked } from 'thespian'
import { EntityEvent } from '../eventSourcing/MessageTypes'

describe('AggregateSnapshotRepository', () => {
  let aggregateRepository: TMocked<AggregateRepository>
  let snapshotRepository: TMocked<SnapshotRepository>
  let repository: AggregateSnapshotRepository
  let thespian: Thespian

  beforeEach(() => {
    thespian = new Thespian()
    aggregateRepository = thespian.mock('aggregateRepository')
    snapshotRepository = thespian.mock('snapshotRepository')
    repository = new AggregateSnapshotRepository(aggregateRepository.object, snapshotRepository.object)
  })

  afterEach(() => {
    thespian.verify()
  })

  it('create', async () => {
    const id = Uuid.createV4()
    const aggregate = new TestAggregate(id).withRoot(id)
    aggregateRepository.setup(x => x.save(aggregate)).returns(() => Promise.resolve(1))
    return repository.create(aggregate)
  })

  it('save without triggering snapshot', async () => {
    const id = Uuid.createV4()
    const aggregate = new TestAggregate(id).withRoot(id)
    aggregate.doSomething()
    aggregateRepository.setup(x => x.save(aggregate)).returns(() => Promise.resolve(1))
    return repository.save(aggregate, 2)
  })

  it('save with snapshot', async () => {
    const id = Uuid.createV4()
    const aggregate = new TestAggregate(id).withRoot(id)
    aggregate.doSomething()
    aggregateRepository.setup(x => x.save(aggregate)).returns(() => Promise.resolve(1))
    snapshotRepository.setup(x => x.saveSnapshot(aggregate)).returns(() => Promise.resolve(1))
    return repository.save(aggregate, 1)
  })

  it('load when no snapshot events', async () => {
    const id = Uuid.createV4()
    const testAggregate = new TestAggregate(id)
    snapshotRepository.setup(x => x.loadSnapshot(id, testAggregate)).returns(() => Promise.resolve(testAggregate))
    aggregateRepository.setup(x => x.load(id, testAggregate)).returns(() => Promise.resolve(testAggregate))
    return repository.load(id, () => testAggregate)
  })

  it('load with snapshot events', async () => {
    const id = Uuid.createV4()
    const aggregate = new TestAggregate(id).withRoot(id)
    const testAggregate = new TestAggregate(id).withRoot(id)
    snapshotRepository.setup(x => x.loadSnapshot(id, testAggregate)).returns(() => Promise.resolve(testAggregate))
    aggregateRepository
      .setup(x => x.loadAfterVersion(id, testAggregate, testAggregate.changeVersion))
      .returns(() => Promise.resolve(aggregate))
    return repository.load(id, () => testAggregate)
  })

  it('subscribeToChangesSynchronously', async () => {
    const handler = async (changes: EntityEvent[]) => {}
    aggregateRepository.setup(x => x.subscribeToChangesSynchronously(e => handler(e)))
    repository.subscribeToChangesSynchronously(e => handler(e))
  })
})
