 ### NZSF Dev Feedback
 
  * some confusion over what events are handled in what event handler, i.e what does in the root aggregate handler vs the entity handler
  * Unsure on relationship between DeviceAggregate, AggregateContainer, Device - how can we make the class heirarchy clearer?
    * the DeviceAggregate is a nice wrapper so we don't have to do `aggregate.rootEntity.foo()` but it does mean a lot of repeated code
    * the AgregateContainer is a nice lifecycle manager for the aggregate but the constructor pattern is confusing
  * 

### MTF Dev Feedback ###
* Would be great if we can solve the reimplementing `makeEventHandler` problem :)
* Projections
  * Event handlers don't feel intuitive (mutating state but then returning a string of a CRUD action??
  * Does there need to be a default value? Or can the entries be created on a create event - if not, we should provide an explanation for this.
  * Just calling `makeProjection` doesn't seem to provide much confidence in what a projection actually is... they do a lot (find current state, call event handlers and persist new state) and it's all hidden away in that one method (really felt a need to dive into the package code). Is there a way we can make the building of projections more similar to how we work with the domain entities? (Consistent feel throughout the package?)
  * Also projection and projectionHandler seems to be used interchangably - e.g. `alarmProjectionHandler = makeProjection(...)` - which is it?


### HYPR Feedback ###
 * A little too much reliance on exception throwing for control flow - Benji
 * eventHandlers mix use patterns on handling new or existing events - Benji
 * I don't quite understand the projection code - Benji
 * Where did we get to with evaluating existing frameworks and what's our threshold for using them over rolling our own? - Benji
 * Entities are created by the Aggregatecontainer, we did this to remove some inheritance. However composition requires that the container create the entity and observe the events it emits. We should do this via a stand observer pattern where the Entity holds a reference to theobserver and calls it back as needed. Without this patter we become stuck when we need to be able to extend this behaviour. If we cannot agree then maybe we should go back to inheritence!!!



