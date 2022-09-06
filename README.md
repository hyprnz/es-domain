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

An implementation of event sourcing making use of the following patterns:

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

# Event Sourcing

_Event Sourcing is a pattern for storing data as events in an append-only log. This simple definition misses the fact that by storing the events, you also keep the context of the events; you know an invoice was sent and for what reason from the same piece of information. In other storage patterns, the business operation context is usually lost, or sometimes stored elsewhere.
_ - Greg Young


Event sourcing has gained in popularity because it enables many other patterns to be brought into play that are also
releant in distrbuted systems including:

- Message - Data encapsulated into a discrete unit
- Event - A message that describes something that has happened
- Command - A message that encapsulates a request to perform an action
- Aggregate - Groups related entities and defines the boundary of these relationships
- CQRS - Command Query Responsibility Segregation
- DDD - Domain Driven Design - a technique to model a system using business language
- Process Manager / Saga - Long running processes that may operate over many aggregates

The benfits of event sourced systems include:

- Audit
- Time travel
- Root cause analysis
- Fault tolerance
- Event-driven architecture
- Asynchronous first
- Service autonomy
- Replay and reshape
- Observability
- Occasionally connected
- One way data flow
- Legacy migration


At the core of all of these patterns are messages. It's important when designing such systems that we don't become hamstrung by not
including some basic information on our messages that will enable rich messaging patterns further down the track.

## Message Use Cases

- We should be able to tell if we have seen the same message before - Identifiable
- We should be able to group messages into related sets - Correlated
- We should be able to tell what caused a message - Causation

# Relevant Events Patterns

- Idempotency - Replies on being identifiable
- Projection - Identifiable, Idempotent
- Process Manager / Saga - Relies on being Identifiable and Correlation and makes use of Causation
- Tracing - Identifiable / Causation

# Command

Encapsulates an action to be performed into a message

# Aggregate

Aggregate is a term that was first introduced within the DDD community.
It describes an entity and its related child entities.

- It has a defined boundary
- Its child entities would not make sense to exist in their own right without the parent.
- The parent entity is referred to as the Root or AggregateRoot.

Back in the day when tools such as Hibernate were used to load a domain we had lazy loading and there was no great need
to define boundaries on our Aggregates. We could happily traverse our domain model and tools like Hibernate would
happily load related data for us as we needed it.

EventSourcing has made the aggregate a much more important concept. This is because when we
load data from an event store we must be able to know in advance what the finite set of events to be loaded is in order
to fully hydrate an aggregate root. In event sourced systems this is often referred to as an EventStream. To be able to
load an aggregate root we must be able to identify its Event Stream. The name or id of this stream is synonymous with
the AggregateId. There are also use cases for maintaining other event streams. We naturally get the `AllEvents`
stream for free as we could replay all our events from the start. We can create other Event Streams by maintaining indexes into
the `AllEvents` stream. We use event streams to identify relevant events that can be replayed sequentially. The Aggregate
Event stream is much like a Clustered Index in an RDB as it is represented by the data stored in your events, the
AggregateId. Other indexes need to be maintained external to the `AllEvents` stream and can identify any arbitrary set
of event types that must be replayed in sequence.

# CQRS

- This pattern is essentially all about separating your read model from your write model.
- This is theoretically not a required pattern.
- In practice an event sourced system built without a read model would be of only limited use.
- The system would not be capable of any finds or queries, only gets by id

CQRS recognizes the fact that:

- Most systems perform many more reads than writes
- The code styles and patterns for the write side of a system are quite different to the read side

So why not separate our read and write models.
EventStores are optimised for the write model, or we could say optimised for updates.
When we update something we make the assumption that we know its ID. So the write model is optimised for loading
something by its id and then appending a state change.

A ReadModel or Query Model is optimised for reading and finding things. E.g. 'Find me all red cars built since year 2020'.
This would be an extremely expensive operation to perform using the write model as we would need to hydrate all cars and
then filter them based on the query parameters.

## Projections

Projections are the view we can create by observing published events and reducing over them.
Projections are not constrained to observing events from just one aggregate type. They can listen to any event published
by the system. This is where the notion of addition event streams can be useful. If we have a projection that we would
like to reconstruct that listens for events from multiple Aggregates then we can either

- Replay all events, or
- Maintain a new index that refers to the events consumed by the projection in sequence

To reconstruct the projection simply replay the EventStream. Advanced event stores like Greg Young's Events Store have
the capability of defining any arbitrary EventStream. New event streams are constructed by iterating over the `AllEvents`
stream from start to finish and adding events that match the index criteria to the index. As new events are written,
indexes are also updated in an eventually consistent manner.

# Process Manager or Saga

Is a pattern that is used to manage sequences of actions that may be performed across multiple aggregates. It is
essentially an asynchronous state machine.

E.g. I have a booking that has reserved 10 seats. To confirm the reservation I need to complete payment.

This operation is orchestrating 10 seat aggregates, a payment aggregate and a payment confirmed event.
Process Manager relies on the Correlation id of the events. The id of a process manager is the correlation id of the
events it observes.

# Domain Driven Design / Domain Model

Original Event sourcing was adopted by the DDD community as an extension to DDD. (This was how I was introduced to
Event Source systems )
Domain models suffered from combining Read and Write models requiring domain models to expose their inner state and
introducing the need for many DTO style objects and their mappings to and from Domain models in order to drive a user
interface or API.

Until recently I had thought that this approach was part of the whole Event Sourcing movement. After doing some recent
research and trying to understand the rationale behind what other people have been doing I realised that this is very
much an optional pattern. It is not so much about event sourcing as about 'do I want to create a domain model to
encapsulate my domain logic or do I want to use something different like functional system for my write model?'.
This has caused me to re-think what's at play here.
Event Sourcing at its heart relies on a map reduce pattern to derive state from a sequence of events.
The style of events we use to record these state changes of course is open to interpretation.

## Generic Events - May contain more data but less information

We could represent state changes using a generic event that can contain any payload of essentially key value pairs.
Our map reduce could simply reduce the values we received, and we would end up with the most recent value of each field.
This approach serves the purpose of storing some state changes over time, however our events are of little use other
than for this use case as they do not describe intent.

# Descriptive Events - Contain less data and more information

In contrast, events that describe things that have happened can be used to derive more information. e.g. CarSoldEvent
might contain a sale price and a date.
We could generate via projections:

- The number of cars sold per month
- The average price
- The permutations are limitless .....

Events are often modeled after business processes and are named using the language of the business.
This ensures that these events have as much meaning as possible in any context.
The more meaningful the events, the richer the projections we may be able to derive from them in the future.

# Domain Model and the Ubiquitous Language

The idea of naming things using the language of the business, so they have meaning across the business as a whole, is
an idea from the DDD community. We have seen how business-style events can contain more information and be more valuable
to the business.

These are some of the founding principles of DDD. The motivation for developing domain models has been to encapsulate
business rules in a single place and to write code that ensures the business rules are applied consistently. This code
is often referred to as the nugget of gold at the centre of a software system that does not deal with technical concerns.
It should read well using the language of the business and should be reasonably easily understood by any business person.

By creating a model we can encapsulate the fields required in order to calculate this state.
It is hidden inside the domain model. Data hiding means that we can change the way in which this state is represented
without affecting code outside that owning object.


# References
## Event Sourcing
- https://www.eventstore.com/blog/snapshotting-strategies (edited)
- https://github.com/jet/equinox/blob/master/DOCUMENTATION.md#cosmos-access-strategy-overviews