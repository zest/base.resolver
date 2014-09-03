[![Dependencies][1]][2] [![Dev Dependencies][3]][4] [![Peer Dependencies][5]][6] [![License][7]][8]

[![Quality][9]][10] [![Build Status][11]][12] [![Coverage Status][13]][14] [![Coverage Status][15]][16]

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
    **resolver**. For dependency injection to work, the argument name and the dependency name must be same.
 2. When the component exports an **array with the last element of type function and other elements of type string**, 
    the angular style dependency injection mechanism is used. The last element of the array must always be a factory
    function whereas, the other arguments are dependency name strings. The dependency name strings can be prepended
    with a **`?`** specifying that an injection for that dependency is optional (meaning that, the component should
    work fine even if this dependency is not registered). This factory function will be called with the parameters
    injected for each of the dependency names in the same sequence.
 3. When a component exports **anything other than the above mentioned structures**, the value itself is used to
    resolve the component.

Example configurations are shown below:

_object as a component_

    module.exports = {
        // component as an object
    };

_component as a factory function. Note the parameter names should match dependency names_

    module.exports = function (database, user, options) {
        return {
            // component as an object
        };
    };

_component as an array of dependencies and factory function. Note that parameter names can be anything here. Also, the
user dependency is optional_

    module.exports = ['database', 'user?', 'options', 'run', function (db, user, opt, run) {
        return {
            // component as an object
        };
    };

_return value as a promise. Any of the above three declaration methods can return a promise instead of an object as 
shown below_

    module.exports = ['database', 'user', 'options', function (db, user, opt) {
        return Q.Promise(function (resolve, reject) {
            // some code
            resolve({
                // component as an object
            });
        });
    };


## Explicit Dependencies

Apart from component dependencies, any component can access the below list of explicit dependencies in the same format
as it accesses component dependencies:

 1. **`options`** dependency is used to inject options passed to the component for its initialization. Options for 
    components can be passed from the config object to the resolver (described below in the config object section)
 2. **`run`** dependency is used to make a component runnable. This dependency gets resolved as a function which takes
    a callback as an argument. When the integration is run, all callbacks registered with run are called. The callbacks
    can either return an object or a promise. If a promise is returned, the resolver run will not be resolved unless 
    the individual callbacks are resolved. Also, asking for a run dependency automatically marks a component as 
    starting component. 
 

## Naming Modularized Components

If a component is a node module complete with a package.json file (it need not actually be in npm, it can be a simple
folder in the code tree.), for base.resolver to register this module as a named component that is injectable, a 
`soul-component` entry must be added to the package.json file of the component.

The package.json structure for the component can be as described:

    // package.json
    {
        ...
        "soul-component": "privilege"
        ...
    }


## Naming Non-Modularized Components

Components that are not node modules can be named by setting the `soul-component` attribute in the returned component
object. Components that are JSON files can also use the same attribute.


## Un-Named Components

If a component is not named, it cannot be injected as a dependency. It might be a good idea to not name components that
cannot be injected (eg. starting components). Since components are lazily initialized, an un-named component will not
be initialized unless it is a starting component.


## configuring **`base.resolver`**

The base.resolver component can be configured using a JavaScript array. The array structure is as shown: 

    [
        // use an object when options are required
        {
            path: "application.rest",
            options: {
                port: 8080
            }
        }, {
            packagePath: "datastore.mongo",
            options: {
                host: "123.456.789.100"
            }
        },
        // if no options are to be passed, only the path is enough
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

### the resolver functions

**`base.resolver`** resolves the component dependencies and is responsible for starting any application built on top of 
them. This component has the below functions

 1. **`config`**`(configPath|configObject)` &#8594; `Promise`

    The config function configures the resolver. This function takes one parameter. If the parameter is a string, 
    requiring the string path should return the config array. Otherwise, the config array itself can be passed.
    
    This function returns a Promise that gets resolved with the resolver object when the configuration is done. This 
    promise is rejected with the error if configuration fails.

 2. **`run`**`()` &#8594; `Promise`

    The run function runs all starting components in the configuration, injecting all other dependencies lazily.
    
    This function returns a Promise that gets resolved with the resolver object when the run is executed. This promise
    is rejected with the error if run execution fails. If the registered run command do not resolve, this promise will
    never get resolved.

 3. **`reload`**`()` &#8594; `Promise`

    The reload function wil re-configure and runs all starting components in the configuration, starting from scratch.
    Reload is synchronous and blocking in nature, if a reload is called before the previous reload is over, the 
    previous reload will be interrupted.
    
    This function returns a Promise that gets resolved with the resolver object when the reload is complete. This 
    promise is rejected with the error if reload fails. If the registered run command do not resolve, this promise will
    never get resolved.

[1]: http://img.shields.io/codeclimate/github/soul-infra/base.resolver.svg?style=flat-square
[2]: https://codeclimate.com/github/soul-infra/base.resolver
[3]: http://img.shields.io/travis/soul-infra/base.resolver.svg?style=flat-square
[4]: https://travis-ci.org/soul-infra/base.resolver
[5]: http://img.shields.io/coveralls/soul-infra/base.resolver.svg?style=flat-square
[6]: https://coveralls.io/r/soul-infra/base.resolver
[7]: http://img.shields.io/david/soul-infra/base.resolver.svg?style=flat-square
[8]: https://david-dm.org/soul-infra/base.resolver#info=dependencies&view=list
[9]: http://img.shields.io/david/dev/soul-infra/base.resolver.svg?style=flat-square
[10]: https://david-dm.org/soul-infra/base.resolver#info=devDependencies&view=list
[11]: http://img.shields.io/david/peer/soul-infra/base.resolver.svg?style=flat-square
[12]: https://david-dm.org/soul-infra/base.resolver#info=peerDependencies&view=list
[13]: http://img.shields.io/github/issues/soul-infra/base.resolver.svg?style=flat-square
[14]: https://github.com/soul-infra/base.resolver/issues
[15]: http://img.shields.io/badge/license-UNLICENSE-brightgreen.svg?style=flat-square
[16]: http://unlicense.org