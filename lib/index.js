'use strict';
/**
 * @fileOverview The resolver module resolves the component dependencies and is responsible for starting any
 * application built on top of them.
 * @module base-resolver
 */
var RunnableProvider = require('base.specifications').base.RunnableProvider,
    logger = require('base.logger')('base.resolver'),
    q = require('q'),
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
        if (registrations[componentName]) {
            logger.error('Component already registered:', componentName);
            throw new Error('Component already registered: ' + componentName);
        }
        logger.log('registering component:', componentName);
        registrations[componentName] = {
            componentClass: componentClass,
            setting: setting
        };
    },
    /**
     * Resolves a component by its name. Returns the instantiated component if a component is registered. Otherwise,
     * throws an exception. A component is instantiated lazily and only once.
     * @param {String} componentName - the name of the component to resolve
     * @returns {q} promise - a promise that resolves with the resolved component object if the component is registered
     *  and gets rejected if no component under the name is registered.
     */
    resolve: function (componentName) {
        return q.Promise(function (resolve, reject) {
            logger.log('resolving component:', componentName);
            if (resolutions[componentName]) {
                return resolve(resolutions[componentName]);
            }
            if (!registrations[componentName]) {
                logger.error('Component is not registered:', componentName);
                return reject(new Error('Component is not registered: ' + componentName));
            }
            resolutions[componentName] = new registrations[componentName].componentClass(
                registrations[componentName].setting,
                this
            );
            delete registrations[componentName];
            return resolve(resolutions[componentName]);
        });
    },
    /**
     * Runs all registered {@link base-specifications/base/RunnableProvider|runnable} components.
     * @returns {q} promise - a promise that resolves when (and if) the runnable components return.
     * @see base-specifications/base/RunnableProvider
     */
    run: function () {
        var resolvePromises = [];
        Object.keys(registrations).forEach(function (componentName) {
            if (registrations[componentName].componentClass.prototype.run) {
                logger.log('resolving component:', componentName);
                resolvePromises.push(module.exports.resolve(componentName));
            }
        });
        return q.allSettled(resolvePromises).then(function () {
            logger.info('all runnables resolved. Running them now!');
            var runPromises = [];
            Object.keys(resolutions).forEach(function (componentName) {
                if (resolutions[componentName].run) {
                    logger.log('running component:', componentName);
                    runPromises.push(resolutions[componentName].run());
                }
            });
            return q.allSettled(runPromises);
        });
    }
};
