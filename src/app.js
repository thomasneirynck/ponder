require.config({
    baseUrl: ".",
    paths: {
        'ponder': 'src',
        'type': "bower_components/type/type",
        'Promise': "bower_components/Promise/Promise",
        'Evented': "bower_components/Evented/Evented",
        'Papa': "vendor/papaparse",
        'jquery': "bower_components/jquery/dist/jquery",
        datatables: 'bower_components/datatables/media/js/jquery.dataTables',
        datatables_colvis: 'vendor/DataTables-1.10.7/extensions/ColVis/js/dataTables.colVis'
    },
    shim: {
        Papa: {
            exports: "Papa",
            init: function () {
                Papa.SCRIPT_PATH = "vendor/papaparse.js";
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
    "ponder/ui/bmu/BMUSelector"
], function (SOMFactory, DataSelector, Map, UMatrixTerrainLayer, BMULayer, AreaSelectLayerController, BMUSelector) {


    var somHandle;
    var uMatrixData;
    var bmus;

    function throwError(error) {
        throw error;
    }


    var dataSelector = new DataSelector("selector");
    dataSelector.on("change", function (table) {
        dataSelector.destroy();
        var dataArray = table.createDataArray();
        createSom(dataArray, table.getSelectedColumns().length, table);
    });

    function createSom(dataArray, codebookLength, dataTable) {

        var map;
        var bmuLayer;
        if (somHandle) {
            somHandle.kill();
            somHandle = null;
            uMatrixData = null;
            bmus = null;
            map = null;
        }

        SOMFactory
            .makeSOMAsync(dataArray, codebookLength)
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
                var umatrixLayer = new UMatrixTerrainLayer("ease");
                umatrixLayer.setUMatrixData(successData.uMatrix, somHandle.width, somHandle.height);
                map.addLayer(umatrixLayer);
                return somHandle.bmus();
            }, throwError)
            .then(function (bmuResult) {

                //bmus
                var bmuLayer = new BMULayer("label", "class", "size", dataTable, bmuResult.locations);
                map.addLayer(bmuLayer);

                var areaSelectLayerController = new AreaSelectLayerController();
                areaSelectLayerController.setOnMap(map);

                new BMUSelector(areaSelectLayerController, bmuLayer, somHandle, "table", "summary");

            }, throwError)
            .then(Function.prototype, throwError);
    }


});


