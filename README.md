# soul-infra / base.resolver
> The base.resolver module provides the resolver api for running of SOUL infrastructure components. It integrates
> components to create an application.

### the resolver

Soul framework also has a resolver in which the components will be registered.

**`base.resolver`** resolves the component dependencies and is responsible for starting any application built on top of 
them. This module has the below functions

1. **`register`**`(name, component, settings)`
    - registers a component.
2. **`resolve`**`(name)`
    - gets the dependency by name
3. **`run`**`()`
    - runs the Runnable components in the resolver