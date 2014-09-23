// documenting the Configuration object
/**
 * An array of Configuration object is passed to configure resolver
 * @typedef {object} module:base-resolver~Configuration
 * @property {string} path - specifies the path of the component
 * <ul><li>if path does not start with a <code>.</code>, or does not contain <code>/</code> the component is assumed to
 * be an npm module</li>
 * <li>if path does not start with a <code>.</code>, and has a single <code>/</code>, the component is assumed to be a
 * git repository</li>
 * <li>in all other cases, the component is assumed to be located at the path specified in the local disk.</li></ul>
 * @property {*} [options] - the options to be passed to instantiate the component.
 * <ul><li>The Parameter Modifier can be used here using the <code>{param-number}</code> format</li>
 * <li>The <code>|</code> (OR modifier) can also be used to gracefully degrade to defaults (explained in the example
 * below)</li>
 * <li>If <code>#</code>, <code>|</code> or <code>/</code> are to be used as literals in option, they must be escaped
 * by a <code>/</code>. Eg. <code>/#</code> will translate to a single <code>#</code></li></ul>
 * @property {boolean} [startup] - startup is optional and is used to specify if a component is a starting component.
 * @property {boolean} [native] - is optional and is used to mark a component as native nodejs module.
 * <ul><li>Native modules are nodejs modules that are not compliant to the zest component structure</li>
 * <li>When a component is marked as native, no dependency will be injected in it</li>
 * <li>A native component can be injected into another component by its module name (as specified in
 * <code>package.json</code> file</li>
 * <li>If no <code>package.json</code> file is found, or if no name is there in <code>package.json</code>, the native
 * component will be named as the last part of the path in configuration excluding extension.</li></ul>
 */

// external node classes
/**
 * The node Buffer class
 * @external Buffer
 * @see {@link http://nodejs.org/api/buffer.html}
 */
/**
 * This module contains utilities for handling and transforming file paths.
 * @external path
 * @see {@link http://nodejs.org/api/path.html}
 */
/**
 * A stream is an abstract interface implemented by various objects in Node
 * @external stream
 * @see {@link http://nodejs.org/api/stream.html}
 */
/**
 * The node stream.Readable class
 * @external Readable
 * @see {@link http://nodejs.org/api/stream.html#stream_class_stream_readable}
 */
// external zest modules
/**
 * base.logger is a basic logger module used throughout zest-infra to log onto the node console or files. It takes a
 * module name as reference and returns a logger object with log, info, warn and error methods.
 * @external base-logger
 * @see {@link https://github.com/zest/base.logger/blob/master/README.md}
 */
// external node modules
/**
 * q is a promise library for node.
 * @external q
 * @see {@link https://www.npmjs.org/package/q}
 */