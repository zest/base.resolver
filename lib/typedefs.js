// documenting the Configuration object
/**
 * An array of Configuration object is passed to configure resolver
 * @typedef {object} module:base-resolver~Configuration
 * @property {string} path - specifies the path of the component
 *
 *  -  if path does not start with a `.`, or does not contain `/` the component is assumed to be an npm module
 *  -  if path does not start with a `.`, and has a single `/`, the component is assumed to be a git repository
 *  -  in all other cases, the component is assumed to be located at the path specified in the local disk.
 *
 * @property {*} [options] - the options to be passed to instantiate the component.
 *  -  The Parameter Modifier can be used here using the `{param-number}` format
 *  -  The `|` (OR modifier) can also be used to gracefully degrade to defaults (explained in the example below)
 *  -  If `#`, `|` or `/` are to be used as literals in option, they must be escaped by a `/`. Eg. `/#` will translate
 *     to a single `#`
 *
 * @property {boolean} [startup] - startup is optional and is used to specify if a component is a starting component.
 * @property {boolean} [native] - is optional and is used to mark a component as native nodejs module.
 *
 *  -  Native modules are nodejs modules that are not compliant to the zest component structure
 *  -  When a component is marked as native, no dependency will be injected in it
 *  -  A native component can be injected into another component by its module name (as specified in `package.json` file
 *  -  If no `package.json` file is found, or if no name is there in `package.json`, the native component will be named
 *     as the last part of the path in configuration excluding extension.
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