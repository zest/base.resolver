[![Quality](https://codeclimate.com/github/soul-infra/base.resolver/badges/gpa.svg)](https://codeclimate.com/github/soul-infra/base.resolver)
[![Dependencies](https://david-dm.org/soul-infra/base.resolver.svg)](https://david-dm.org/soul-infra/base.resolver)
[![Build Status](https://secure.travis-ci.org/soul-infra/base.resolver.svg)](https://travis-ci.org/soul-infra/base.resolver)
[![Coverage Status](https://img.shields.io/coveralls/soul-infra/base.resolver.svg)](https://coveralls.io/r/soul-infra/base.resolver)

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