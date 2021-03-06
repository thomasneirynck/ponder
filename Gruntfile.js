var git = require("git-rev");
var async = require("async");
var buildify = require('buildify');

var releaseDir = "./release/";
var wwwRelease = "www/";
var wwwReleaseDir = releaseDir + wwwRelease;

var somWorkerScript = "src/som/worker/SOMWorker.js";
var somWorkerScriptDestination = "js/worker/SOMWorker.js";

var appModule = "app/www/js/ponder/app";
var appDestination = wwwReleaseDir + "js/ponder/app.js";

var apiModule = "api/ponder";
var apiDestination = releaseDir + "api/ponder.js";

var workerDir = "js/worker/";
var PapaParse = "papaparse";

var versionSlug = "";

module.exports = function (grunt) {

    require("load-grunt-tasks")(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        jshint: {
            source: [
                "src",
                "./app/www/js/ponder"
            ],
            options: {
                reporterOutput: ""
            }
        },
        clean: {
            release: [
                releaseDir
            ]
        },
        copy: {
            www_images: {
                files: [
                    {expand: true, cwd: "app/www", src: ['images/**'], dest: wwwReleaseDir, filter: 'isFile'},
                    {expand: true, cwd: "bower_components/datatables/media/", src: ['images/**'], dest: wwwReleaseDir + "bower/datatables/", filter: 'isFile'}
                ]
            },
            www_text: {
                options: {
                    process: function (content, name) {
                        if (name === "app/www/index.html") {
                            content = content.replace(/\<\!\-\-REQUIRE_SOURCE\-\-\>((.|[\r\n])*?)\<\!\-\-REQUIRE_SOURCE\-\-\>/g, ' <script src="js/ponder/app.js"></script>');
                            return content;
                        } else {
                            return content;
                        }
                    }
                },
                files: [
                    {expand: true, cwd: "app/www", src: ['**', '!js/**', '!css/app.css', '!images/**'], dest: wwwReleaseDir, filter: 'isFile'}
                ]
            },
            www_js: {
                files: [
                    {expand: true, cwd: "vendor", src: [PapaParse + ".js"], dest: wwwReleaseDir + workerDir, filter: 'isFile'},
                    {expand: true, cwd: "bower_components/requirejs", src: ["require.js"], dest: wwwReleaseDir + "js/", filter: 'isFile'}
                ]
            },
            api_worker: {
                files: [
                    {
                        src: "release/www/js/worker/SOMWorker.js",
                        dest: "release/api/ponder_worker.js"
                    }
                ]
            }

        },
        requirejs: {

            ponderApp: {
                options: {
                    baseUrl: ".",
                    mainConfigFile: appModule + ".js",
                    name: "bower_components/almond/almond.js",
                    include: appModule,
                    out: appDestination,
                    optimize: "uglify2",
                    // optimize: "none",
                    options: {
                        mangle: true,
                        compress: false,
                        preserveComments: 'some',
                        preserve: ["foobarWorker", "foobarScript"]
                    },
                    onBuildRead: function (moduleName, path, contents) {
                        /**
                         * Ensure workers are loaded correctly
                         */
                        if (moduleName === appModule) {
                            contents = contents.replace(/\/\*\*\{\{PAPA_PARSE_SCRIPT_PATH\}\}\*\/(.*?)\/\*\*\{\{PAPA_PARSE_SCRIPT_PATH\}\}\*\//g, "\"" + workerDir + PapaParse + ".js" + "\"");
                            contents = contents.replace(/\/\*\*\{\{PAPA_PARSE_MODULE_PATH\}\}\*\/(.*?)\/\*\*\{\{PAPA_PARSE_MODULE_PATH\}\}\*\//g, "\"" + workerDir + PapaParse + "\"");
                            contents = contents.replace(/\/\*\*\{\{BASE_URL\}\}\*\/(.*?)\/\*\*\{\{BASE_URL\}\}\*\//g, "\".\"");
                            contents = contents.replace(/\/\*\*\{\{SOM_SCRIPT_PATH\}\}\*\/(.*?)\/\*\*\{\{SOM_SCRIPT_PATH\}\}\*\//g, "\"" + somWorkerScriptDestination + "\"");
                        } else if (moduleName.endsWith('SOMFactory')) {
                            contents = embedWorker(contents);
                        }
                        return contents;
                    }
                }
            },

            api: {
                options: {
                    baseUrl: ".",
                    mainConfigFile: apiModule + ".js",
                    name: "bower_components/almond/almond.js",
                    include: apiModule,
                    out: apiDestination,
                    optimize: "uglify2",
                    // optimize: "none",
                    options: {
                        mangle: true,
                        compress: false
                    },
                    wrap: {
                        start: "(function() {",
                        end: "require('api/ponder');}());"
                    },
                    onBuildRead: function (moduleName, path, contents) {
                        if (moduleName.endsWith('SOMFactory')) {
                            contents = embedWorker(contents);
                        }
                        return contents;
                    }
                }
            },


            somWorker: {
                options: {
                    baseUrl: ".",
                    mainConfigFile: somWorkerScript,
                    name: "bower_components/almond/almond.js",
                    include: somWorkerScript,
                    out: wwwReleaseDir + somWorkerScriptDestination,
                    wrapShim: true,
                    optimize: "uglify2",
                    options: {
                        mangle:true
                    },
                    onBuildRead: function (moduleName, path, contents) {
                        if (moduleName === somWorkerScript) {
                            contents = contents.replace(/\/\*\*\{\{REQUIREJS_IMPORT\}\}\*\/(.*?)\/\*\*\{\{REQUIREJS_IMPORT\}\}\*\//g, "");
                        }
                        return contents;
                    }
                }
            },

            mainCss: {
                options: {
                    cssIn: "./app/www/css/main.css",
                    out: wwwReleaseDir + "css/main.css",
                    optimize: "uglify2"
                }
            }
        },

        compress: {
            main: {
                options: {
                    archive: function () {
                        return releaseDir + "ha.ponder.zip"
                    }
                },
                files: [
                    {cwd: releaseDir, src: [wwwRelease + "**"], dest: 'ponder', filter: 'isFile', expand: true}
                ]
            }
        }
    });

    function embedWorker(contents) {
        buildify()
        .load(wwwReleaseDir + somWorkerScriptDestination)
        .perform(function (workerContent) {
            var worker = JSON.stringify(workerContent);
            var createWithEmbeddedWorker = "(function a(){var blobURL = URL.createObjectURL(new Blob([" + worker + "], { type: 'application/javascript' } ) ); return new Worker(blobURL);}())";
            contents = contents.replace(/\/\*\!keep_this\*\/(.*?)\/\*\!keep_this\*\//g, createWithEmbeddedWorker);
        });
        return contents;
    }

    grunt.registerTask("embed-worker", function () {

        console.log(appDestination);

        buildify()
        .load(appDestination)
        .perform(function (appContent) {


            buildify()
            .load(wwwReleaseDir + somWorkerScriptDestination)
            .perform(function (workerContent) {
                console.log(appContent.length, workerContent.length);

                var createWithEmbeddedWorker = "function a(){var blobURL = URL.createObjectURL(new Blob([`" + workerContent + "`], { type: 'application/javascript' } ) ); return new Worker(blobURL);}";
                console.log(appContent.indexOf("heyo"));
                appContent = appContent.replace("function a(a){return new Worker(a);}", createWithEmbeddedWorker);

                console.log('done replacing');
            });

            console.log('must return', appContent.length);
            return appContent;

        })
        .save(appDestination)
    });

    grunt.registerTask("correct-css", function(){

        var file = wwwReleaseDir + "css/main.css";
        buildify()
            .load(file)
            .perform(function(contents){
                return contents.replace(/\.\.\/\.\.\/\.\.\/bower_components\/datatables\/media\//g,"../bower/datatables/");
            })
            .save(file);

    });

    grunt.registerTask("tag-with-revision", function (a, b) {

        var done = this.async();

        function nodify(func) {
            return function (callback) {
                func(function (result) {
                    callback(null, result);
                });
            };
        }

        async.parallel([git.branch, git.tag, git.short].map(nodify), function (err, results) {
            versionSlug = results.join("_") + "_SNAPSHOT";
            [wwwReleaseDir + "js/worker/SOMWorker.js", wwwReleaseDir + "js/ponder/app.js"].forEach(function (file) {
                buildify()
                    .load(file)
                    .perform(function (content) {
                        var versionTag = "if(!this['ha_ponder']){this['ha_ponder']={version:\"" + versionSlug + "\"}};";
                        return versionTag + content;
                    })
                    .save(file);
            });
            done();
        });


    });


    grunt.registerTask("build-www", ["clean", "copy:www_images", "copy:www_text", "copy:www_js", "requirejs:somWorker", "requirejs:ponderApp", "requirejs:api", "requirejs:mainCss", "correct-css"]);
    grunt.registerTask("release", ["jshint", "build-www", "copy:api_worker", "tag-with-revision", "compress"]);
    grunt.registerTask("default", ["release"]);

};
