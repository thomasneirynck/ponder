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
                    optimize: "uglify2",
                    options: {
                        mangle: true,
                        compress: false
                    },
                    onBuildRead: function (moduleName, path, contents) {
                        if (moduleName === appModule) {
                            contents = contents.replace(/\/\*\*\{\{PAPA_PARSE_SCRIPT_PATH\}\}\*\/(.*?)\/\*\*\{\{PAPA_PARSE_SCRIPT_PATH\}\}\*\//g, "\"" + workerDir + PapaParse + ".js" + "\"");
                            contents = contents.replace(/\/\*\*\{\{PAPA_PARSE_MODULE_PATH\}\}\*\/(.*?)\/\*\*\{\{PAPA_PARSE_MODULE_PATH\}\}\*\//g, "\"" + workerDir + PapaParse + "\"");
                            contents = contents.replace(/\/\*\*\{\{BASE_URL\}\}\*\/(.*?)\/\*\*\{\{BASE_URL\}\}\*\//g, "\".\"");
                            contents = contents.replace(/\/\*\*\{\{SOM_SCRIPT_PATH\}\}\*\/(.*?)\/\*\*\{\{SOM_SCRIPT_PATH\}\}\*\//g, "\"" + somWorkerScriptDestination + "\"");
                        }
                        return contents;
                    }
                    //,
                    //paths: {
                    //    plotly: "empty:"
                    //}
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

    grunt.registerTask("correct-css", function(){

        var file = wwwReleaseDir + "css/main.css";
        buildify()
            .load(file)
            .perform(function(contents){
                return contents.replace(/\.\.\/\.\.\/\.\.\/bower_components\/datatables\/media\//g,"../bower/datatables/");
            })
            .save(file);

    });
    grunt.registerTask("correct-plotly", function(){

        var file = wwwReleaseDir + "js/ponder/app.js";
        buildify()
            .load(file)
            .perform(function(contents){
                return "Plotly=this.Plotly||{}"+contents;
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



    grunt.registerTask("build-www", ["clean", "copy", "requirejs","correct-css","correct-plotly"]);
    grunt.registerTask("release", ["jshint", "build-www","tag-with-revision", "compress"]);
    grunt.registerTask("default", ["release"]);

};
