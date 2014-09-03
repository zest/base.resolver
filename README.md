[![Quality](https://codeclimate.com/github/soul-infra/base.resolver/badges/gpa.svg)](https://codeclimate.com/github/soul-infra/base.resolver)
[![Dependencies](https://david-dm.org/soul-infra/base.resolver.svg)](https://david-dm.org/soul-infra/base.resolver)
[![Build Status](https://secure.travis-ci.org/soul-infra/base.resolver.svg)](https://travis-ci.org/soul-infra/base.resolver)
[![Coverage Status](https://img.shields.io/coveralls/soul-infra/base.resolver.svg)](https://coveralls.io/r/soul-infra/base.resolver)

# soul-infra / base.resolver
> The `base.resolver` component provides inversion of control and dependency injection api for running of SOUL 
> infrastructure components. Using resolver, you set up a simple configuration and tell resolver which components you
> want to load. Each component registers itself with resolver, so other components can use its functions. Components
> can be maintained as NPM packages so they can be dropped in to other soul integrations

## Component Structure

For components to be compatible with the resolver, it should export a one of the following:

 1. When a component exports an **object**, the value itself is used to resolve the component 
 2. When a component exports a **function**, the function acts like a factory function for creation of the component. The 
    function can either return the component itself, or a **Promise** object that gets resolved with the component once
    the component is finished loading. The arguments for the function are injected dynamically by the **resolver**. For
    dependency injection to work, the argument name and the dependency name must be same.
 3. When the component exports is an **array**, the angular style dependency injection mechanism is used. The last element
    of the array must always be a factory function whereas, the other arguments are dependency name strings. This 
    factory function will be called with the parameters injected for each of the dependency names in the same sequence.  

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

_component as an array of dependencies and factory function. Note that parameter names can be anything here._

    module.exports = ['database', 'user', 'options', 'run', function (db, user, opt, run) {
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

Apart from component dependencies, any component can access the below list of explicit dependencies in the same format as
it accesses component dependencies:

 1. **`options`** dependency is used to inject options passed to the component for its initialization. Options for 
    components can be passed from the config object to the resolver (described below in the config object section)
 2. **`run`** dependency is used to make a component runnable. This dependency gets resolved as a function which takes
    a callback as an argument. When the integration is run, all callbacks registered with run are called. The callbacks
    can either return an object or a promise. If a promise is returned, the resolver run will not be resolved unless 
    the individual callbacks are resolved. Also, asking for a run dependency automatically marks a component as 
    starting component. 
 

## package.json Structure

Each component is a node module complete with a package.json file. It need not actually be in npm, it can be a simple 
folder in the code tree. For base.resolver to register this module as a component, a `soul-component` entry must be
added to the package.json file of the component.

The package.json structure for the component can be as described:

    // package.json
    {
        ...
        "soul-component": "privilege"
        ...
    }

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
    
    This function returns a Promise that gets resolved when the configuration is done. This promise is rejected with 
    the error if configuration fails.

 2. **`run`**`()` &#8594; `Promise`

    The run function runs all starting components in the configuration, injecting all other dependencies lazily.
    
    This function returns a Promise that gets resolved when the run is executed. This promise is rejected with 
    the error if run execution fails. If the registered run command do not resolve, this promise will never get 
    resolved.

 3. **`reload`**`()` &#8594; `Promise`

    The reload function wil re-configure and runs all starting components in the configuration, starting from scratch.
    Reload is synchronous and blocking in nature, if a reload is called before the previous reload is over, the 
    previous reload will be interrupted.
    
    This function returns a Promise that gets resolved when the reload is complete. This promise is rejected with 
    the error if reload fails. If the registered run command do not resolve, this promise will never get resolved.