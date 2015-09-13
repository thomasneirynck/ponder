require.config({
    baseUrl: /**{{BASE_URL}}*/"../.."/**{{BASE_URL}}*/,
    paths: {
        'ponder': 'src',
        'type': "bower_components/type/type",
        'Promise': "bower_components/Promise/Promise",
        'Evented': "bower_components/Evented/Evented",
        'Papa': /**{{PAPA_PARSE_MODULE_PATH}}*/"vendor/papaparse"/**{{PAPA_PARSE_MODULE_PATH}}*/,
        'jquery': "bower_components/jquery/dist/jquery",
        datatables: 'bower_components/datatables/media/js/jquery.dataTables',
        datatables_colvis: 'vendor/DataTables-1.10.7/extensions/ColVis/js/dataTables.colVis'
    },
    shim: {
        Papa: {
            exports: "Papa",
            init: function () {

                Papa.SCRIPT_PATH = /**{{PAPA_PARSE_SCRIPT_PATH}}*/require.toUrl("Papa") + ".js";
                /**{{PAPA_PARSE_SCRIPT_PATH}}*/

            }
        },
        jquery: {
            exports: "jquery"
        }
    }
});

require([
    "ponder/som/SOMFactory",
    "ponder/dataload/DataSelector",
    "ponder/ui/Map",
    "ponder/ui/umatrix/UMatrixTerrainLayer",
    "ponder/ui/bmu/BMULayer",
    "ponder/ui/areaselect/AreaSelectLayerController",
    "ponder/ui/bmu/BMUSelector",
    "jquery"
], function (SOMFactory, DataSelector, Map, UMatrixTerrainLayer, BMULayer, AreaSelectLayerController, BMUSelector, jquery) {

    var somHandle;

    SOMFactory.SCRIPT_PATH = /**{{SOM_SCRIPT_PATH}}*/null/**{{SOM_SCRIPT_PATH}}*/;

    function throwError(error) {
        console.error(error);
        throw error;
    }


    var dataSelector = new DataSelector("selector", "selectorStyle");
    dataSelector.on("change", function (table) {

        dataSelector.destroy();
        jquery("#selector").hide();
        var somTrainingData = table.createSOMTrainingData();



        var map;
        if (somHandle) {
            somHandle.kill();
            somHandle = null;
            if (map) {
                map.destroy();
            }
            map = null;
        }

        SOMFactory
            .makeSOMAsync(somTrainingData.dataArray, somTrainingData.codebookWeights)
            .then(function (aSomHandle) {
                somHandle = aSomHandle;
                return somHandle.trainMap();
            }, throwError)
            .then(function () {
                return somHandle.uMatrixNormalized();
            }, throwError)
            .then(function (successData) {

                map = new Map("map", somHandle.width, somHandle.height);

                //u-matrix
                var umatrixLayer = new UMatrixTerrainLayer("ease", "easeReadout");
                umatrixLayer.setUMatrixData(successData.uMatrix, somHandle.width, somHandle.height);
                map.addLayer(umatrixLayer);
                return somHandle.bmus();
            }, throwError)
            .then(function (bmuResult) {

                //bmus
                var bmuLayer = new BMULayer("label", "class", "size", table, bmuResult.locations);
                map.addLayer(bmuLayer);

                var areaSelectLayerController = new AreaSelectLayerController();
                areaSelectLayerController.setOnMap(map);

                new BMUSelector(areaSelectLayerController, bmuLayer, somHandle, "table", "summary");

            }, throwError)
            .then(Function.prototype, throwError);
    });

    function createSom(dataArray, codebookLength, dataTable) {


    }


});


