[![Dependencies][dependencies-image]][dependencies-link]
[![Dev Dependencies][dev-dependencies-image]][dev-dependencies-link]
[![Peer Dependencies][peer-dependencies-image]][peer-dependencies-link]

[![Quality][quality-image]][quality-link]
[![Build Status][build-status-image]][build-status-link]
[![Coverage Status][coverage-status-image]][coverage-status-link]
[![License][license-image]][license-link]


# soul-infra / base.resolver

> The `base.resolver` component provides inversion of control and dependency injection api for running of SOUL 
> infrastructure components. Using resolver, you set up a simple configuration and tell resolver which components you
> want to load. Each component registers itself with resolver, so other components can use its functions. Components
> can be maintained as NPM packages so they can be dropped in to other soul integrations. Simple components can also 
> just be a file that can be `require`d from node. (A javascript file or even a JSON file) 


## Component Structure

For components to be compatible with the resolver, it should export a one of the following:

 1. When a component exports a **function**, the function acts like a factory function for creation of the component.
    The function can either return the component itself, or a **Promise** object that gets resolved with the component
    once the component is finished loading. The arguments for the function are injected dynamically by the
    **resolver**. For dependency injection to work, the argument names must resolve to a dependency name using the 
    [dependency name resolution mechanism](#dependency-name-resolution).
    
 2. When the component exports an **array with the last element of type function and other elements of type string**, 
    the angular style dependency injection mechanism is used. The last element of the array must always be a factory
    function whereas, the other arguments must resolve to a dependency name using the
    [dependency name resolution mechanism](#dependency-name-resolution). This factory function will be called with
    the parameters injected for each of the dependency names in the same sequence. The function can either return the
    component itself, or a **Promise** object that gets resolved with the component once the component is finished
    loading.
    
 3. When a component exports **a promise** the value that resolves it is used as the component.
    
 4. When a component exports **anything other than the above mentioned structures**, the value itself is used to
    resolve the component.

Example configurations are shown below:

_object as a component_

```js
module.exports = {
    // component as an object
};
```

_component as a factory function. Note the parameter names should match dependency names_


```js
module.exports = function (database, user, options) {
    return {
        // component as an object
    };
};
```

_component as an array of dependencies and factory function. Note that parameter names can be anything here. Also, the
user dependency is optional_

```js
module.exports = ['database', 'user?', 'options', 'unload', function (db, user, opt, unload) {
    return {
        // component as an object
    };
};
```
_return value as a promise. Any of the above three declaration methods can return a promise instead of an object as 
shown below_


```js
module.exports = ['database', 'user', 'options', function (db, user, opt) {
    return Q.Promise(function (resolve, reject) {
        // some code
        resolve({
            // component as an object
        });
    });
};
```


### Naming Modularized Components

If a component is a node module complete with a package.json file (it need not actually be in npm, it can be a simple
folder in the code tree.), for base.resolver to register this module as a named component that is injectable, a 
`soul-component` entry must be added to the package.json file of the component.

The package.json structure for the component can be as described:

```js
// package.json
{
    ...
    "soul-component": "privilege"
    ...
}
```


### Naming Non-Modularized Components

Components that are not node modules can be named by setting the `soul-component` attribute in the returned exports
object. Components that are JSON files can also use the same attribute.


### Un-Named Components

A component might not have a name. If unnamed, it cannot be injected as a dependency.


### Dependency Name Resolution

The dependency name resolution mechanism is used to map a string (which can be a dependency name in the array syntax of
component definition or a parameter name in the function syntax of component definition, see
[Component Structure](#component-structure)) The resolution follows the below steps:


#### Modifiers
Modifiers are used to add logic to dependency injection. There are 3 kinds of modifiers. They are listed in their order
of execution priority below:

 - **`#` (parameter modifier)** will pass parameters to the component that can be used to construct the options object.
    See [Configuring Resolver](#configuring-resolver) for more details on parameter usage.
 - **`|` (OR modifier)** will inject the first resolvable component
 - **`?` (optional modifier)** will silently pass undefined if resolution fails

> Modifier usage examples:
> 
> `databaseMongo`
> 
> - will resolve to databaseMongo if it can be resolved
> - will throw an error if databaseMongo cannot be resolved
> 
> `databaseMongo|databaseSQL`
> 
> - will resolve to databaseMongo if it can be resolved
> - will resolve to databaseSQL is databaseMongo cannot be resolved
> - will throw an error if none of them are resolved
> 
> `databaseMongo?`
> 
> - will resolve to databaseMongo if it can be resolved
> - will inject `undefined` if databaseMongo cannot be resolved
> 
> `databaseMongo|databaseSQL?`
> 
> - will resolve to databaseMongo if it can be resolved
> - will resolve to databaseSQL if databaseMongo cannot be resolved
> - will inject `undefined` if none of them are resolved
> 
> `databaseMongo#localhost#9876`
> 
> - will resolve to databaseMongo replacing `#1` in options object by `localhost` and `#2` in options object by `9876`
> - will throw an error if databaseMongo cannot be resolved
> 
> `databaseMongo#localhost#9876|databaseSQL#localhost#3200?`
> 
> - will resolve to databaseMongo replacing `#1` in options object by `localhost` and `#2` in options object by `9876`
>   if it can be resolved
> - will resolve to databaseSQL  replacing `#1` in options object by `localhost` and `#2` in options object by `3200`
>   if databaseMongo cannot be resolved
> - will inject `undefined` if none of them are resolved


#### Name Resolution
The dependency names are resolved using the below steps:

 1. If the name matches a component name, the component is injected directly.

    > eg. `database` will get resolved to a component with name `database` if it exists.
    
 2. If **`[step 1]`** fails, the component name is transformed to camel-case, `-` and `.` separated, and a resolution
    is attempted for any one of the transformed names. There is no priority specified, so, If more than one resolution
    is found, the behavior is un-predictable. 

    > eg. `databaseMongoLocal` will try to resolve to `database-mongoLocal`, `databaseMongo-local`,
    > `database-mongo-local`, `database-mongo.local`, `database.mongoLocal`... and all other combinations possible. If
    > there are more than components defined with any of these names, the resolution is unpredictable.


### Explicit Dependencies

Apart from component dependencies, any component can access the below list of explicit dependencies in the same format
as it accesses component dependencies:

 1. **`options`** dependency is used to inject options passed to the component for its initialization. Options for 
    components can be passed from the config object to the resolver (described below in the config object section)
    
 3. **`unload`** dependency is used to cleanup and garbage collect a component before it is unloaded. This dependency
    gets resolved as a function which takes a callback as an argument. When the component is unloaded, all callbacks
    registered with unload are called. The callbacks can either return an object or a promise. If a promise is 
    returned, the component unload will not be complete unless the individual callbacks are resolved.


## Configuring Resolver

The base.resolver component can be configured using a JavaScript array. Every element in the array will correspond to a
component configuration.

 -  If no options are to be passed on to the component, the path of the component as a string is enough.
 -  If options are to be passed, or if other configuration is required, then the component configuration should contain
    the following keys:
    
     -  **`path`** &#8594; specifies the path of the component
         -  if path does not start with a `.`, or does not contain `/` the component is assumed to be an npm module
         -  if path does not start with a ., and has a single /, the component is assumed to be a git repository
         -  in all other cases, the component is assumed to be located at the path specified in the local disk 
     -  **`options`** &#8594; the options to be passed to instantiate the component.
         -  The [Parameter Modifier](#modifiers) can be used here using the `#[param-number]` format
         -  The `|` (OR modifier) can also be used to gracefully degrade to defaults (explained in the example below)
         -  If `#` or `|` are to be used as literals in option, they must be escaped by writing them twice. Eg. `##`
            will translate to a single `#`
     -  **`startup`** &#8594; is optional and is used to specify if a component is a starting component.

```js
[
    // use an object when options are required
    {
        path: "./application.rest",
        startup: true,
        options: {
            port: 8080
        }
    }, {
        packagePath: "soul-infra/datastore.mongo",
        options: {
            // parameters can be injected inside the options using the #[param-number] format
            // also the OR modifier | can be used to degrade to defaults. The below string will 
            // evaluate to:
            //      the first parameter passed to get the component if it exists
            //      123.456.789.100 is the first parameter is not there
            host: "#[1]|123.456.789.100"
        }
    },
    
    // if no options or flags are to be passed, only the path is enough
    // if path does not start with a ., the component is assumed 
    // to be an npm module
    "base.specifiations"
    
    // if path does not start with a ., and has a /, the component
    // is assumed to be a git repository
    "soul-infra/base.logger",
    
    // if path starts with a ., it is assumed to be a local path
    "./filestore.disk",
    "../another-folder/another.component"
]
```


## The Resolver Functions

**`base.resolver`** resolves the component dependencies and is responsible for starting any application built on top of 
them. This component has the below functions

 1. **`config`**`(configPath|configObject, [basePath])` &#8594; `Promise`

    The config function configures the resolver. This function takes two parameter.
     -  **`configPath|configObject`** If this parameter is a string, requiring the string path should return the config
        array. We try to require the `configPath` directly. If that fails, it is joined with the current working
        directory of the process for resolution. The config array itself can also be passed instead of passing a
        `configPath`.
     -  **`basePath`** basePath is an optional parameter which provides the absolute path from where the components 
        should be resolved. If `basePath` is not provided, it is resolved as follows:
         -  if the first parameter is a `configPath` string, the `basePath` is assumed to be the `configPath`
         -  if the first parameter is a not a `configPath` string, the `basePath` is assumed to be the current working
            directory for the process

    This function returns a Promise that gets resolved with the resolver object when the configuration is done. This 
    promise is rejected with the error if configuration fails.

 2. **`start`**`()` &#8594; `Promise`

    The start function runs all starting components in the configuration, injecting all other dependencies required.
    
    This function returns a Promise that gets resolved with the resolver object when the startup is executed. This 
    promise is rejected with the error if start execution fails.

 3. **`restart`**`()` &#8594; `Promise`

    The restart function will re-configure and start all starting components in the configuration.
    If a `restart` is called before the previous `restart` is over, the previous `restart` will be interrupted.
    
    This function returns a Promise that gets resolved with the resolver object when the reload is complete. This 
    promise is rejected with the error if reload fails. If the registered run command do not resolve, this promise will
    never get resolved.

[dependencies-image]: http://img.shields.io/david/soul-infra/base.resolver.svg?style=flat-square
[dependencies-link]: https://david-dm.org/soul-infra/base.resolver#info=dependencies&view=list
[dev-dependencies-image]: http://img.shields.io/david/dev/soul-infra/base.resolver.svg?style=flat-square
[dev-dependencies-link]: https://david-dm.org/soul-infra/base.resolver#info=devDependencies&view=list
[peer-dependencies-image]: http://img.shields.io/david/peer/soul-infra/base.resolver.svg?style=flat-square
[peer-dependencies-link]: https://david-dm.org/soul-infra/base.resolver#info=peerDependencies&view=list
[license-image]: http://img.shields.io/badge/license-UNLICENSE-brightgreen.svg?style=flat-square
[license-link]: http://unlicense.org
[quality-image]: http://img.shields.io/codeclimate/github/soul-infra/base.resolver.svg?style=flat-square
[quality-link]: https://codeclimate.com/github/soul-infra/base.resolver
[build-status-image]: http://img.shields.io/travis/soul-infra/base.resolver.svg?style=flat-square
[build-status-link]: https://travis-ci.org/soul-infra/base.resolver
[coverage-status-image]: http://img.shields.io/coveralls/soul-infra/base.resolver.svg?style=flat-square
[coverage-status-link]: https://coveralls.io/r/soul-infra/base.resolver