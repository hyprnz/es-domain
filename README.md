# Contributing

## Creating a new Relase
 - Ensure all tests are passing
 - Bump the version in `package.json`
 - Create a tag, ```git tag -a v0.1.0 -m "Add some description here"```
 - Push your code and tag, ```git push --tags```
 - From GitHub, create a new release and select the tag, created from the previous step
 - Creating a release triggers a Git Action which builds and publishes the package
    - Check that the new package built and was deployed succesfull

# Introduction

An implementation of [event sourcing](./docs/eventSourcing.md) making use of the following patterns:

- Domain Style Events
- CQRS
- Write Side

  - Event sourced Aggregate (As a container for Entities)
  - Domain Model supports complex entities with children
  - Event Store, with optimistic concurrency detection
  - Event Store abstracted behind repositories
  - Ability to use snapshots for free with AggregateSnapshotRepository or the simpler AggregateRepository without snapshots.

- Read Side

  - Read model repository
  - Read model observes persisted/committed events
  - Read model projections
    - Examples of projections at the entity level
    - Aggregated values at the aggregate root level
    - Aggregated at the global level

- Sample Bounded context

  - Device / Alarm models
  - Projections
    - alarmProjectionHandler
    - deviceAlarmCountProjection
    - allAlarmCountProjection

  Sample application

  - see: `DeviceApplication.test.ts`

> NOTE: This implementation is not using Commands and Process Manager pattern has not been implemented, significant ids still to be added to events

# Getting Started

`npm i`

# Build and Test

```
npm run compile
npm run test:micro
```

# Contribute

TODO: Explain how other users and developers can contribute to make your code better.



# References
## Event Sourcing
- https://www.eventstore.com/blog/snapshotting-strategies (edited)
- https://github.com/jet/equinox/blob/master/DOCUMENTATION.md#cosmos-access-strategy-overviews