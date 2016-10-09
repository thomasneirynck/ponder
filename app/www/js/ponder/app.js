require.config({
    baseUrl: /**{{BASE_URL}}*/"../.."/**{{BASE_URL}}*/,
    paths: {
        'demo': 'app/www/js/ponder',
        'ponder': 'src',
        'type': "bower_components/type/type",
        'Promise': "bower_components/Promise/Promise",
        'Evented': "bower_components/Evented/Evented",
        'Papa': /**{{PAPA_PARSE_MODULE_PATH}}*/"vendor/papaparse"/**{{PAPA_PARSE_MODULE_PATH}}*/,
        'jquery': "bower_components/jquery/dist/jquery",
        datatables: 'vendor/DataTables-1.10.7/media/js/jquery.dataTables',
        datatables_colvis: 'vendor/DataTables-1.10.7/extensions/ColVis/js/dataTables.colVis',
        jStat: "vendor/jstat",
        introJs: "vendor/intro.js-2.0.0/minified/intro.min"
    },
    shim: {
        Papa: {
            exports: "Papa"
        },
        jquery: {
            exports: "jquery"
        },
        jStat: {
            exports: "jStat"
        },
        "introJs": {
            exports: "introJs"
        }
    }
});


require([
    "demo/DataSelector",
    "ponder/ui/Map",
    "ponder/ui/umatrix/UMatrixTerrainLayer",
    "ponder/ui/bmu/BMULayer",
    "ponder/ui/areaselect/AreaSelectLayerController",
    "ponder/ui/highlight/HoverController",
    "ponder/ui/highlight/SelectController",
    "ponder/ui/bmu/BMUSelector",
    "ponder/ui/bmu/BMUSelectionHistory",
    "ponder/util",
    "ponder/appApi",
    "introJs",
    "jquery"
], function (DataSelector, Map, UMatrixTerrainLayer, BMULayer, AreaSelectLayerController, HoverController, SelectController, BMUSelector, BMUSelectionHistory, util, appApi, introJs, jquery) {


    Papa.SCRIPT_PATH = /**{{PAPA_PARSE_SCRIPT_PATH}}*/require.toUrl("Papa") + ".js"/**{{PAPA_PARSE_SCRIPT_PATH}}*/;


    var dataSelector = new DataSelector("selector", "tablePreview");
    dataSelector.on("error", function () {
        alert("Cannot read table");
    });


    dataSelector.on("tableLoaded", function () {
        document.getElementById("blurb").style.display = "none";
        document.getElementById("uploadblurb").style.display = "none";
        document.getElementById("faq").style.display = "none";
    });


    dataSelector.on("change", function (table) {

        dataSelector.destroy();
        jquery("#welcome").hide();

        //figure out title
        var title = util.getParameterByName("title") ? util.getParameterByName("title") : table.getName();
        document.getElementById("title-blurb").innerHTML = title.toUpperCase();

        var somApp = appApi.createSOM({
            table: table,
            somWorkerScriptPath: /**{{SOM_SCRIPT_PATH}}*/null/**{{SOM_SCRIPT_PATH}}*/,
            nodes: {
                toolbar: "mapToolContainer",
                mapTableToggle: "toggle",
                table: "tableContainer",
                map: "map",
                toggleToMap: "toggle-to-map",
                toggleToTable: "toggle-to-table",
                container: document.body,
                center: "center",
                waiting: "waiting"

            }
        });






    });




});


