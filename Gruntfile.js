var git = require("git-rev");
var async = require("async");
var buildify = require('buildify');


var releaseDir = "./release/";
var wwwRelease = "www/";
var wwwReleaseDir = releaseDir + wwwRelease;

var somWorkerScript = "src/som/worker/SOMWorker.js";
var somWorkerScriptDestination = "js/worker/SOMWorker.js";
var appModule = "app/www/js/ponder/app";

var workerDir = "js/worker/";
var PapaParse = "papaparse";

var versionSlug = "";

module.exports = function (grunt) {

    require("load-grunt-tasks")(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        jshint: {
            source: [
                "./src",
                "app/www/js/ponder"
            ]
        },
        clean: {
            release: [
                releaseDir
            ]
        },
        concat: {
            css: {
                options: {
                    separator: '\n'
                },
                src: ['app/www/css/app.css', 'bower_components/datatables/media/css/jquery.dataTables.css'],
                dest: wwwReleaseDir + "css/all.css"
            }
        },
        copy: {
            www_images: {
                files: [
                    {expand: true, cwd: "app/www", src: ['images/**'], dest: wwwReleaseDir, filter: 'isFile'},
                    {expand: true, cwd: "bower_components/datatables/media", src: ['images/**'], dest: wwwReleaseDir, filter: 'isFile'}
                ]
            },
            www_text: {
                options: {
                    process: function (content, name) {
                        if (name === "app/www/index.html") {
                            content = content.replace(/\<\!\-\-CSS_FILES\-\-\>((.|[\r\n])*?)\<\!\-\-CSS_FILES\-\-\>/g, '<link rel="stylesheet" type="text/css" href="css/all.css"/>');
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
            }
        },
        requirejs: {

            ponderApp: {
                options: {
                    baseUrl: ".",
                    mainConfigFile: appModule + ".js",
                    name: "bower_components/almond/almond.js",
                    include: appModule,
                    out: wwwReleaseDir + "js/ponder/app.js",
                    wrapShim: true,
                    optimize: "uglify2",
                    uglify2: {
                        mangle: true
                    },
                    onBuildRead: function (moduleName, path, contents) {
                        if (moduleName === appModule) {
                            contents = contents.replace(/\/\*\*\{\{PAPA_PARSE_SCRIPT_PATH\}\}\*\/(.*?)\/\*\*\{\{PAPA_PARSE_SCRIPT_PATH\}\}\*\//g, "\"" + workerDir + PapaParse + ".js" + "\"");
                            contents = contents.replace(/\/\*\*\{\{PAPA_PARSE_MODULE_PATH\}\}\*\/(.*?)\/\*\*\{\{PAPA_PARSE_MODULE_PATH\}\}\*\//g, "\"" + workerDir + PapaParse + "\"");
                            contents = contents.replace(/\/\*\*\{\{BASE_URL\}\}\*\/(.*?)\/\*\*\{\{BASE_URL\}\}\*\//g, "\".\"");
                            contents = contents.replace(/\/\*\*\{\{SOM_SCRIPT_PATH\}\}\*\/(.*?)\/\*\*\{\{SOM_SCRIPT_PATH\}\}\*\//g, "\"" + somWorkerScriptDestination + "\"");
                        } else if (moduleName === "Plotly") {
                            //plotly makes baby-jesus cry by not being compatible with requirejs.(https://github.com/plotly/plotly.github.io/issues/74)
                            contents = "Plotly={};" + contents;
                        }
                        return contents;
                    }
                }
            },
            somWorker: {
                options: {
                    baseUrl: ".",
                    mainConfigFile: somWorkerScript,
//                    name: somWorkerScript,
                    name: "bower_components/almond/almond.js",
                    include: somWorkerScript,
                    out: wwwReleaseDir + somWorkerScriptDestination,
                    wrapShim: true,
                    optimize: "uglify2",
                    uglify2: {
                        mangle: true
                    },
                    onBuildRead: function (moduleName, path, contents) {
                        if (moduleName === somWorkerScript) {
                            contents = contents.replace(/\/\*\*\{\{REQUIREJS_IMPORT\}\}\*\/(.*?)\/\*\*\{\{REQUIREJS_IMPORT\}\}\*\//g, "");
                        }
                        return contents;
                    },
                    wrap: {
                        start: "importScripts(\"../require.js\");"
                    }
                }
            }
        },

        compress: {
            main: {
                options: {
                    archive: function () {
                        return releaseDir + "ha.ponder" + ((versionSlug) ? "_" + versionSlug : "") + ".zip"
                    }
                },
                files: [
                    {cwd: releaseDir, src: [wwwRelease + "**"], dest: 'ponder', filter: 'isFile', expand: true}
                ]
            }
        }
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



    grunt.registerTask("build-www", ["clean", "copy", "concat:css", "requirejs"]);

    grunt.registerTask("release", ["jshint", "build-www", "tag-with-revision", "compress"]);

};
