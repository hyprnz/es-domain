import { ContainerRequest, CosmosClient } from '@azure/cosmos'

export const makeMigrator = (client: CosmosClient, databaseId: string, containerName: string = 'eventstore') => {
  async function up(): Promise<void> {
    // logger.debug("### Migrating... ###");
    try {
      const { database } = await client.databases.createIfNotExists({
        id: databaseId
      })

      const { resources: foundContainers } = await database.containers.readAll().fetchAll()

      // Define the partition key and unique index
      const eventStoreSettings: ContainerRequest = {
        id: containerName,
        partitionKey: {
          paths: ['/aggregateRootId']
        },
        indexingPolicy: {
          indexingMode: 'consistent'
        },
        uniqueKeyPolicy: {
          uniqueKeys: [{ paths: ['/aggregateRootId', '/version'] }]
        }
      }

      if (!foundContainers.length) {
        // Create Containers
        await database.containers.create(eventStoreSettings)
      } else {
        // For some reason these only work intermittently?
        await database.containers.createIfNotExists(eventStoreSettings)
      }

      // logger.debug("### Migration complete! ###");
    } catch (e) {
      // logger.error(new NestedError("There was an error creating the DB:", e));
      console.error('There was an error creating:')
      throw e
    }
  }

  async function down(): Promise<void> {
    // logger.debug("### Deleting DB... ###");
    try {
      await client.database(databaseId).container(containerName).delete()

      await client.database(databaseId).delete()
      // logger.debug("### DB deleted! ###");
    } catch (e) {
      // logger.error(new NestedError("There was an error deleting the DB:", e));
      console.error('There was an error deleting the DB')
      throw e
    }
  }

  return { up, down }
}
