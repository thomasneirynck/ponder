var git = require("git-rev");
var async = require("async");
var buildify = require('buildify');

var wwwReleaseDir = "./wwwwrelease/";

var workerDir = "js/worker/";
var PapaParse = "papaparse.js";

module.exports = function (grunt) {

    require("load-grunt-tasks")(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        jshint: {
            options: {
                multistr: true,
                eqnull: true
            },
            source: [
                "./src",
                "app/www/js/ponder"
            ]
        },
        clean: {
            release: [
                wwwReleaseDir
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
                    {expand: true, cwd: "app/www", src: ['images/**'], dest: wwwReleaseDir, filter: 'isFile'}
                ]
            },
            www_text: {
                options: {
                    process: function (content, name) {
                        if (name === "app/www/index.html") {
                            content = content.replace(/\<\!\-\-CSS_FILES\-\-\>((.|[\r\n])*?)\<\!\-\-CSS_FILES\-\-\>/g, '<link rel="stylesheet" type="text/css" href="css/all.css"/>');
                            content = content.replace(/\<\!\-\-REQUIRE_SOURCE\-\-\>((.|[\r\n])*?)\<\!\-\-REQUIRE_SOURCE\-\-\>/g, ' <script data-main="js/ponder/app.js" src="js/require.js" ></script>');
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
                    {expand: true, cwd: "vendor", src: [PapaParse], dest: wwwReleaseDir + workerDir, filter: 'isFile'},
                    {expand: true, cwd: "bower_components/requirejs", src: ["require.js"], dest: wwwReleaseDir + "js/", filter: 'isFile'}
                ]
            }
        },
        requirejs: {

            ponderApp: {
                options: {
                    baseUrl: ".",
                    mainConfigFile: "app/www/js/ponder/app.js",
                    name: "app/www/js/ponder/app",
                    out: wwwReleaseDir + "js/ponder/app.js",
                    wrapShim: true,
                    optimize: "uglify2",
                    uglify2: {
                        mangle: false
                    },
                    exclude: ["Papa"],
                    onBuildRead: function (moduleName, path, contents) {
                        if (moduleName === "app/www/js/ponder/app") {
                            contents = contents.replace(/\/\*\*\{\{PAPA_PARSE_SCRIPT_PATH\}\}\*\/(.*?)\/\*\*\{\{PAPA_PARSE_SCRIPT_PATH\}\}\*\//g, "\"" + workerDir + PapaParse + "\"");
                            contents = contents.replace(/\/\*\*\{\{PAPA_PARSE_MODULE_PATH\}\}\*\/(.*?)\/\*\*\{\{PAPA_PARSE_MODULE_PATH\}\}\*\//g, "\"" + workerDir + "papaparse" + "\"");
                            contents = contents.replace(/\/\*\*\{\{BASE_URL\}\}\*\/(.*?)\/\*\*\{\{BASE_URL\}\}\*\//g, "\".\"");
                            contents = contents.replace(/\/\*\*\{\{SOM_SCRIPT_PATH\}\}\*\/(.*?)\/\*\*\{\{SOM_SCRIPT_PATH\}\}\*\//g, "\"js/worker/SOMWorker.js\"");
                        }
                        return contents;

                    }
                }
            },
            somWorker: {
                options: {
                    baseUrl: ".",
                    mainConfigFile: "src/som/worker/SOMWorker.js",
                    name: "src/som/worker/SOMWorker",
                    out: wwwReleaseDir + "js/worker/SOMWorker.js",
                    wrapShim: true,
                    optimize: "uglify2",
                    uglify2: {
                        mangle: false
                    },
                    onBuildRead: function (moduleName, path, contents) {
                        if (moduleName === "src/som/worker/SOMWorker") {
                            contents = contents.replace(/\/\*\*\{\{REQUIREJS_IMPORT\}\}\*\/(.*?)\/\*\*\{\{REQUIREJS_IMPORT\}\}\*\//g, "");
                        }
                        return contents;
                    },
                    wrap: {
                        start: "importScripts(\"../require.js\");"
                    }
                }
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
            var version = results.join("_") + "_SNAPSHOT";
            [wwwReleaseDir + "js/worker/SOMWorker.js", wwwReleaseDir + "js/ponder/app.js"].forEach(function (file) {
                buildify()
                    .load(file)
                    .perform(function (content) {
                        var versionTag = "if(!this['ha_ponder']){this['ha_ponder']={version:\"" + version + "\"}};";
                        return versionTag + content;
                    })
                    .save(file);
            });
            done();
        });


    });

    grunt.registerTask("build-www", ["clean", "copy", "concat:css", "requirejs"]);



    grunt.registerTask("release", ["jshint", "build-www", "tag-with-revision"]);

};
