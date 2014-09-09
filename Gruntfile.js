// merge is for merging jslint options
var merge = require('merge');
module.exports = function (grunt) {
    'use strict';
    // global variables are defined here
    var files = {
            lib: [
                '<%= pkg.directories.lib %>/**/*.js',
                '<%= pkg.directories.lib %>/**/*.json'
            ],
            test: [
                '<%= pkg.directories.test %>/**/*.js',
                '<%= pkg.directories.test %>/**/*.json',
                '!**/node_modules/**'
            ],
            build: [
                'Gruntfile.js',
                'package.json'
            ]
        },
    // the list of files to be documented
        documentationFiles = [].concat(
            files.lib,
            [
                './README.md'
            ]
        ),
    // mocha globals
        mochaGlobals = [
            'describe',
            'it',
            'beforeEach',
            'afterEach',
            'before',
            'after'
        ],
    // jslint default options
        jslintOptions = {
            passfail: false,
            ass: false,
            bitwise: false,
            closure: false,
            'continue': false,
            debug: false,
            eqeq: false,
            evil: false,
            forin: false,
            newcap: false,
            nomen: false,
            plusplus: false,
            regexp: false,
            unparam: true,
            sloppy: false,
            stupid: false,
            sub: false,
            todo: false,
            vars: false,
            white: false,
            indent: 4,
            maxlen: 120
        };
    // load the required npm tasks
    // ...for cleaning the output directories
    grunt.loadNpmTasks('grunt-contrib-clean');
    // ...for watching for file changes
    grunt.loadNpmTasks('grunt-contrib-watch');
    // ...for code quality
    grunt.loadNpmTasks('grunt-jslint');
    // ...for generating jsdoc documentation
    grunt.loadNpmTasks('grunt-jsdoc');
    // ...for running node mocha tests and code coverage reports
    grunt.loadNpmTasks('grunt-mocha-cov');
    // Project configuration.
    grunt.initConfig({
        // read the package.json for use
        pkg: grunt.file.readJSON('package.json'),
        // mocha and coverage configuration
        mochacov: {
            options: {
                // set test-case timeout in milliseconds [2000]
                timeout: 50000,
                // check for global variable leaks.
                'check-leaks': true,
                // specify user-interface (bdd|tdd|exports).
                ui: 'bdd',
                // "slow" test threshold in milliseconds [75].
                slow: 10,
                files: [
                    '<%= pkg.directories.test %>/**/*.js',
                    '!**/node_modules/**'
                ]
            },
            // default test option
            test: {
                options: {
                    reporter: 'spec'
                }
            },
            coverageTerm: {
                options: {
                    reporter: 'mocha-term-cov-reporter',
                    coverage: true
                }
            },
            // for sending coverage report to coveralls
            coverage: {
                options: {
                    coveralls: true
                }
            }
        },
        // clean configuration
        clean: {
            out: [
                '<%= pkg.directories.out %>'
            ],
            doc: [
                '<%= pkg.directories.doc %>/**/*',
                '!<%= pkg.directories.doc %>/jsdoc.json'
            ]
        },
        // watch configuration
        watch: {
            // watch for javascript changes
            lib: {
                files: files.lib,
                tasks: [
                    'lib-queue'
                ]
            },
            // watch for specification changes
            test: {
                files: files.test,
                tasks: [
                    'test-queue'
                ]
            },
            build: {
                files: files.build,
                tasks: [
                    'build-queue'
                ]

            }
        },
        // jslint configuration
        jslint: {
            // validation for all server javascript files
            lib: {
                src: files.lib,
                directives: merge({
                    node: true
                }, jslintOptions),
                options: {
                    // only display errors when set to true
                    errorsOnly: false,
                    // specify an edition of jslint or use 'dir/mycustom-jslint.js' for own path
                    edition: 'latest',
                    // defaults to true
                    failOnError: false
                }
            },
            // validation for all server javascript specifications
            test: {
                src: files.test,
                directives: merge({
                    node: true,
                    predef: mochaGlobals
                }, jslintOptions),
                options: {
                    // only display errors when set to true
                    errorsOnly: false,
                    // specify an edition of jslint or use 'dir/mycustom-jslint.js' for own path
                    edition: 'latest',
                    // defaults to true
                    failOnError: false
                }
            },
            // validation for all server javascript specifications
            build: {
                src: files.build,
                directives: merge({
                    node: true
                }, jslintOptions),
                options: {
                    // only display errors when set to true
                    errorsOnly: false,
                    // specify an edition of jslint or use 'dir/mycustom-jslint.js' for own path
                    edition: 'latest',
                    // defaults to true
                    failOnError: false
                }
            }
        },
        // jsdoc configuration
        jsdoc: {
            lib: {
                src: documentationFiles,
                dest: '<%= pkg.directories.doc %>',
                options: {
                    configure: '<%= pkg.directories.doc %>/jsdoc.json',
                    template: './node_modules/ink-docstrap/template'
                }
            }
        },
        exec: {
            coverage: 'cat "<%= pkg.directories.out %>/coverage/reports/lcov/lcov.info" '
                + '| "./node_modules/coveralls/bin/coveralls.js"'
        }
    });
    // for faster builds we make sure that only the changed files are validated
    (function () {
        // save the watch timeouts to keep track of the ongoing watches
        var watchTimeouts = {};
        grunt.event.on('watch', function (action, filepath, target) {
            if (action !== 'deleted' && /\.(js(on)?)$/i.test(filepath)) {
                var config = [],
                    jslintSrc = 'jslint.' + target + '.src';
                if (watchTimeouts[target]) {
                    // if there is an ongoing watch event, append the new files
                    // in the file list
                    clearTimeout(watchTimeouts[target]);
                    config = grunt.config(jslintSrc);
                } else {
                    // in case of a new watch, create a new file list
                    grunt.config(jslintSrc, config);
                }
                // pass the file for jslint validation only if it is a javascript or a json file
                config.push(filepath);
                grunt.config(jslintSrc, config);
                watchTimeouts[target] = setTimeout(function () {
                    watchTimeouts[target] = undefined;
                }, 1000);
            }
        });
    }());
    // scripts exposed from package.json
    // cleanup script
    grunt.registerTask('cleanup', [
        'clean:out'
    ]);
    // coverage script
    grunt.registerTask('coverage', [
        'mochacov:coverage'
    ]);
    // init script
    grunt.registerTask('init', [
    ]);
    // test script
    grunt.registerTask('test', [
        'jslint:lib',
        'jslint:test',
        'jslint:build',
        'mochacov:test',
        'mochacov:coverageTerm'
    ]);
    // document script
    grunt.registerTask('document', [
        'clean:doc',
        'jsdoc:lib'
    ]);
    // observe scripts
    // tasks to run when files change
    grunt.registerTask('lib-queue', [
        'jslint:lib',
        'mochacov:test',
        'mochacov:coverageTerm',
        'document'
    ]);
    grunt.registerTask('test-queue', [
        'jslint:test',
        'mochacov:test',
        'mochacov:coverageTerm'
    ]);
    grunt.registerTask('build-queue', [
        'jslint:build'
    ]);
    grunt.registerTask('observe', [
        'init',
        'test',
        'document',
        'watch'
    ]);
    // observe is the default task
    grunt.registerTask('default', [
        'observe'
    ]);
};
