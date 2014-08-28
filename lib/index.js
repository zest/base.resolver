'use strict';
/**
 * @fileOverview The resolver module resolves the component dependencies and is responsible for starting any
 * application built on top of them.
 * @module base-resolver
 */
var RunnableProvider = require('base.specifications').base.RunnableProvider,
    registrations = {},
    resolutions = {};
module.exports = {
    /**
     * Registers a Component Class.
     * @param {String} componentName - the name of the component
     * @param {ComponentProvider} componentClass - the Class of the component
     * @param {Object} setting - the Class of the component
     */
    register: function (componentName, componentClass, setting) {
        if(registrations[componentName]) {
            throw new Error('Component already registered: ' + componentName);
        }
        registrations[componentName] = {
            componentClass: componentClass,
            setting: setting
        };
    },
    /**
     * Resolves a component by its name. Returns the instantiated component if a component is registered. Otherwise,
     * throws an exception. A component is instantiated lazily and only once.
     * @param {String} componentName - the name of the component to resolve
     * @returns {base-specifications/base/ComponentProvider} the resolved component object
     * @throws if no component under the name is registered.
     */
    resolve: function (componentName) {
        if (resolutions[componentName]) {
            return resolutions[componentName];
        }
        if (!registrations[componentName]) {
                throw new Error('Component is not registered: ' + componentName);
        }
        resolutions[componentName] = new registrations[componentName].componentClass(
            registrations[componentName].setting,
            this
        );
        delete registrations[componentName];
        return resolutions[componentName];
    },
    /**
     * Runs all registered {@link base-specifications/base/RunnableProvider|runnable} components.
     * @see base-specifications/base/RunnableProvider
     */
    run: function () {
        Object.keys(registrations).forEach(function (componentName) {
            module.exports.resolve(componentName);
        });
        Object.keys(resolutions).forEach(function (componentName) {
            if (resolutions[componentName] instanceof RunnableProvider) {
                resolutions[componentName].run();
            }
        });
    }
};
