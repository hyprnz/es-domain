# Introduction 
An implementation of event sourcingmaking use of following patterns
- Domain Style Events
- CRQS
- Write Side
  - Event sourced Aggregate (As a container for Entities)
  - Domain Model supports complex entities with children
  - Event Store, with optomistic concurrency detection
  - Eventstore abstracted behind repositories

- Read Side
  - Read model repository
  - Read model observes persisted/committed events
  - Read model projections
    - Examples of projections at the entity level
    - Aggregated values at the aggregate root level
    - Addregated at the global level

- Sample Bounded context
  - Device / Alarm models
  - Projections
    - alarmProjectionHandler
    - deviceAlarmCountProjection
    - allAlarmCountProjection

  Sample application
    - see: `DeviceApplication.test.ts`


> NOTE: This implementation is not using Commands and Process Manager pattern has not been implmented, significant ids still to be added to events
# Getting Started
```npm i```

# Build and Test
```
npm run compile
npm run test:micro
```


# Contribute
TODO: Explain how other users and developers can contribute to make your code better. 



# EventSourcing
Eventsourcing is a general term used to describe many differnt types of systems that derive some state from events.
Often people refer to systems as Eventsourced. This is often just one of many patterns they are actually refering to.
I'll quickly explain the various patterns that you may often see in event sourced systems

Eventsourcing has gained in populatity because it enables many other patterns to be brought into play that are also very popular in their own right

Patterns such as:
- Message - Data encapuclated into a discrete unit
- Event - A message that describes something that has happended
- Command - A message that encapsulate requests to perform an action
- Aggregate - Groups related entites and defines the boundry of these relationships
- CQRS - Comand Query Responsibility Segregation 
- DDD  - Domain Driven Design / Domain Modeling
- Process Manager / Saga - Long running processes that may operate over many 



It would be possible to build an event sourced system that made use of all or none of these patterns 
- Though Arguabley events might be a required pattern to be event sourced?


At the core of all of these patterns are messages. Its important when designing such system that we don't become hamstrung by not 
including on our messages some basic information that will enable rich messaging patterns further down the track

## Message Use Cases
We should be able to tell if we have seen the same message before - Identifyable
We should be able to group messages into related sets - Correlated
We should be able to tell what caused a message - Causation

# Relavant Events Patterns
Idempotency - Replies on being identifyable
Projection - Identifyable , Idempotent
Process Manager / Saga - Relies on being Identifyable and Correlation and makes use of Causation
Tracing - Identifyable / Causation

# Command 
Encapsulates an action to be performed into a message

# Aggregate
Aggregate is a term that was first introduced within the DDD comunity 
It describes an entity and its related child entities.
- It has a defined boundry
- Its child entities would not make sense to exist in their own right without the parent.
- The parent entity is refered to as the Root or AggregateRoot.

Back in the day where tools such as Hiberate were used to load a domain we had lazy loading and there was no great need to define boundaries on our Aggregates. We could happly traverse our domain model and tools like Hibernate would happily load related data for us as we needed it. 

EventSourcing has made the aggregate a much more tangable thing that really cannot be ignored. This is because when we load data from an event store we must be able to know in advance what the finite set of events to be loaded is in order to fully hydrate an aggregate root.  In event sourced system this is often refered to as an EventStream.  To be able to load an aggregate root we must be able to identify it's Event Stream. The name or id of this stream is sonominous with the AggregateId. There are also use cases for maintining other event streams. We natrally get the all events stream for free as we could replay all our events from the the start. We can create other Event Streams by maintaining indexes into the all event Strem. We use event streams to identify relevant events that can be replayed squentually.  The Aggregate Event stream is much liek a Clustered Index in an RDB as it is represented by the data stored in your events, the AggregateId. Other indexs need to be maintained external to the 'All Event Stream' and can identify any abatry set of event types that must be replayed in sequence.

# CQRS
This pattern is essentually all about seperating your read model from your write model. 
This is threoretically not a required pattern. 
In practice an event sourced systems built without a read model would be of only limited use.
The system would be no capable of and finds or queries. 
Only gets by id

CRQS recognizes that fact that:
- Most systems perform many more reads tha writes
- The code styles and patterns for the write side of a system are quite different to the read side

So why not seperate our read and write models. 
EventStores are optimized for the write model or we could say optimised for updates.  
When we update something we make the assumtion that we know what it ID. So the write model is optomised for loading something by its id and then appending a state change.

A ReadModel or Query Model is optimised for reading and finding things. Find me all red cars built since year 2020
This would be an extremely expensive operation to perform using the the write model as we would need to hydrate all cars and then filter them based on the query parameters.

## Projections
Projections are the view we can create by observing published events and reducing over them. 
Projections are not constrained to observing events from just one aggregate type. They can listen to any event published by the system. This is where the notion of addition event streams can be usefull. If we have a projection that we would like to recontract that listens for events from multiple Aggregates then we can either
 - Replay all events
 - Or maintain a new index that refers to the events consumed by the projection in sequence

 To reconstrct the projection simply replay the EventStream. Advanced event stores like Greg Youngs Events Store have the capability of defining any abatory EventStream. New event streams are constructed by iterating over the `AllEvents` stream from start to finish and adding events that match the index criteria to the index. As new events are writtent indexes are also updated in an eventually consistent manner


# Process Manager or Saga
Is a pattern that is used to manage sequences of actions that may be performed accross multiple aggregates. It is essentually an asynchronous state machine.

E.g. I have a booking that has reserved 10 seats. To confirm the reservation i need to complete payment.

This operation is orchstrating 10 seat aggregates a payment aggregate and payment confirmed event.
Process Manager relies on the Correlation id of the events. The id of a process manager is the correlation id of the events it observes.


# Domain Driven Design / Domain Model
Originall Eventsourcing was adopted by the DDD comunity as an extension to DDD.  (This was how i was introduced to EventSource systems )
Domain models suffered from combinging Read and Write models requiring domain models to expose their inner state and introducing the need for many DTO style objects and their mappings to and from Domain models in order to drive a user interface or Api.

Until recently i had thought that this approach was part of the whole Event Sourceing movement. After doing some recent research and trying to understand the rational behind what other people have been doing i relaized that this is very much an optional pattern. It is not so much about event sourcing as about do i want to create a domain model to encapsulate my domain logic or do i want to use something different like functional system for my write model.

This has caused me to re-think whats at play here.
EventSourcing at its heart relies on a map reduce pattern to derive state from a sequence of events.
The style of events we use to record these state changes of course is open to interpretation.

## Generic Events - May contain more data but less information
We could represent state changes using a generic event that can contain any payload of essentually key value pairs. 
Our map reduce could simply reduce the values we received and we would end up with the most recent value of each field.  
This approach serves the purpose of storing some state changes over time, however our events are of little use other than for this use case as they do not describe intent. 

# Descriptive Events - Contain less data and more information
In contrast events that describe things that have happened can be used to derive more information. e.g. CarSoldEvent might contain a sale price and a date. 
We could generate via projections:
- The number of cars sold per month
- The average price
- The permetations are limitless .....

Events are often modeled after business processes and are named using the language of the business. 
This ensure that these events have as much meaning as possible in any context. 
The more meaning full the events the richer the projetions we may be able to derive from them in the future

# Domain Model and the Ubiquitous Language
The idea of naming things using the language of the business so they have meaning across the business as a whole is an idea from DDD comminity. We have seen how business style events can contain more information and be more valuable to the business.

These are some of the founding principles of DDD. The motivation for developing domain models has been to encapsulate business rules in a single place and to write code ensures the business rules are applied consistenntly. This code is often refered to as the nuget of gold at the centre of a software system that does not deal with technical concerns. It should read well using the language of the busness and reasonably easily understood by any business person.

By creating a model we can encapsulate the fields required in order to calculate this state. 
It is hidden inside the domain model. Data hiding means that we can chnage the way in which this state is represented with out affecting code outside of that owning object

































