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
                    optimize: "none",
                    uglify2: {
                        mangle: false
                    },
                    exclude: ["Papa"],
                    onBuildRead: function (moduleName, path, contents) {
                        if (moduleName === "app/www/js/ponder/app") {
                            contents = contents.replace(/\/\*\*\{\{PAPA_PARSE_SCRIPT_PATH\}\}\*\/(.*?)\/\*\*\{\{PAPA_PARSE_SCRIPT_PATH\}\}\*\//g, "\"" + workerDir + PapaParse + "\"");
                            contents = contents.replace(/\/\*\*\{\{PAPA_PARSE_MODULE_PATH\}\}\*\/(.*?)\/\*\*\{\{PAPA_PARSE_MODULE_PATH\}\}\*\//g, "\"" + workerDir + "papaparse" + "\"");
                            contents = contents.replace(/\/\*\*\{\{BASE_URL\}\}\*\/(.*?)\/\*\*\{\{BASE_URL\}\}\*\//g, "\".\"");
                            return contents;
                        } else {
                            return contents;
                        }
                    }
                }
            }
            //,
//            papaFileAndWorker: {
//
//            },
//            somWorker: {
////        options: {
////          mainConfigFile: "www/src/worker/WorkerCommandParser.js",
////          name: "./src/worker/WorkerCommandParser",
////          out: workerFile,
////          wrapShim: true,
////          optimize: "uglify2",
////          uglify2: {
////            mangle: false
////          },
////          onBuildWrite: function (moduleName, path, contents) {
////            contents = contents.replace("importScripts(\"../../vendor/requirejs/require.js\");", "");
////            return contents;
////          },
////          wrap: {
////            start: "importScripts(\"../../vendor/requirejs/require.js\");self.jQuery = {};self.$ = self.jQuery;"
////          }
////        }
//            }
        }
    });


    grunt.registerTask("tag_with_revision", function (a, b) {

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
            [ponderApp, somWorker].forEach(function (file) {
                buildify()
                    .load(file)
                    .perform(function (content) {
                        var versionTag = "if(!this['ha.ponder']){this['ha.ponder']={version:\"" + version + "\"}};";
                        return versionTag + content;
                    })
                    .save(file);
            });
            done();
        });


    });

    grunt.registerTask("build-www", ["clean", "copy", "concat:css", "requirejs"]);


    grunt.registerTask("release", ["jshint", "build-www", "tag_with_revision"]);

};
