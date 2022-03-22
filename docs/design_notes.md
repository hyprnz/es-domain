 **NZSF Dev Feedback
 
  * some confusion over what events are handled in what event handler, i.e what does in the root aggregate handler vs the entity handler
  * Unsure on relationship between DeviceAggregate, AggregateContainer, Device - how can we make the class heirarchy clearer?
    * the DeviceAggregate is a nice wrapper so we don't have to do `aggregate.rootEntity.foo()` but it does mean a lot of repeated code
    * the AgregateContainer is a nice lifecycle manager for the aggregate but the constructor pattern is confusing
  * 
