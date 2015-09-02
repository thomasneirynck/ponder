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
    "Papa",
    "jquery",
    "ponder/ui/umatrix/ColorMapper",
    "ponder/ui/umatrix/EasingInput",
    "ponder/select/AreaSelect",
    "ponder/ui/DataSelector",
    "ponder/DataTable",
    "ponder/ui/SummaryChart",
    "ponder/ui/Map",
    "ponder/ui/umatrix/UMatrixTerrainLayer",
    "ponder/ui/bmu/BMULayer",
    "datatables"
], function (SOMFactory, Papa, jquery, ColorMapper, EasingInput, AreaSelect, DataSelector, DataTable, SummaryChart, Map, UMatrixTerrainLayer, BMULayer, datatables) {


    var somHandle;
    var buffer;
    var context2d;
    var uMatrixData;
    var bufferImageData;
    var bmus;
    var dataTable;

    var selectElement;
    var classElement;
    var sizeElement;


//    var colorMapper = new ColorMapper();
//    var areaSelect = new AreaSelect("som");
//    areaSelect.on("change", function () {
//
//        if (!bmus) {
//            return;
//        }
//
//        var selectedIndices = [];
//        for (var i = 0; i < bmus.length; i += 1) {
//            if (areaSelect.isInsideSelectedArea(toViewX(bmus[i].x), toViewY(bmus[i].y))) {
//                selectedIndices.push(i);
//            }
//        }
//
//
//        somHandle
//            .statistics(selectedIndices)
//            .then(function (stats) {
//
//
//                var data = stats.getIndices().map(function (index) {
//                    return dataTable.getFeatureData(index);
//                });
//
//
//                document.getElementById("table").innerHTML = "";
//
//                var table = document.createElement("table");
//                table.cellpadding = 0;
//                table.cellspacing = 0;
//                table.border = 0;
//                table.class = "display";
//                document.getElementById("table").appendChild(table);
//
//                jquery(table).dataTable({
//                    searching: true,
//                    ordering: true,
//                    paging: true,
//                    "data": data,
//                    "columns": dataTable.getColumns().map(function (e) {
//                        return {
//                            title: e
//                        };
//                    })
//                });
//
//
//                document.getElementById("summary").innerHTML = "";
//                var summary = new SummaryChart("summary", stats.getMins(), stats.getMaxs(), dataTable.getSelectedColumns());
//
//
//            }, function (e) {
//                throw e;
//            }).then(Function.prototype, function (e) {
//                throw e;
//            });
//
//        invalidate();
//    });

//    areaSelect.on("input", invalidate);


    var dataSelector = new DataSelector("selector");
    dataSelector.on("change", function (event) {

        dataSelector.destroy();

        dataTable = new DataTable(event.data, event.columns, event.selectedColumns);
        var dataArray = dataTable.createDataArray();

        createSom(dataArray, event.selectedColumns.length, event.columns, event.selectedColumns, dataTable);

//        var labelSelectTag = $("<select />");
//        var classSelectTag = $("<select />");
//        for (var index in event.columns) {
//            $("<option />", {value: index, text: event.columns[index]}).appendTo(labelSelectTag);
//            $("<option />", {value: index, text: event.columns[index]}).appendTo(classSelectTag);
//        }
//
//        labelSelectTag.appendTo("#label");
//        labelSelectTag.on("change", invalidate);
//        selectElement = labelSelectTag[0];
//
//
//        classSelectTag.appendTo("#class");
//        classSelectTag.on("change", invalidate);
//        classElement = classSelectTag[0];
//
//        var sizeTag = $("<select />");
//        for (var index in event.selectedColumns) {
//            $("<option />", {value: dataTable.getColumnIndex(event.selectedColumns[index]), text: event.selectedColumns[index]}).appendTo(sizeTag);
//        }
//        sizeTag.appendTo("#size");
//        sizeTag.on("change", invalidate);
//        sizeElement = sizeTag[0];
//
//        invalidate();

    });


    function throwError(error) {
        throw error;
    }


    function createSom(dataArray, codebookLength, columns, selectedColumns, dataTable) {

        var map;
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
            })
            .then(function (successData) {

                map = new Map("map", somHandle.width, somHandle.height);
                var umatrixLayer = new UMatrixTerrainLayer("ease");
                umatrixLayer.setUMatrixData(successData.uMatrix, somHandle.width, somHandle.height);
                map.addLayer(umatrixLayer);

                return somHandle.bmus();

            })
            .then(function (bmuResult) {

                bmus = bmuResult.locations;

                console.log("loading bmu layer");
                var bmuLayer = new BMULayer("label", "class", "size", columns, selectedColumns, dataTable, bmus);
                map.addLayer(bmuLayer);

//                labelNode, classNode, columns, selectedColumns, dataTable, bmus

            }, throwError)
            .then(function(){

            }, throwError);
    }


//    function draw() {
//        handle = null;
//        if (!context2d) {
//            return;
//        }
//        context2d.clearRect(0, 0, context2d.canvas.width, context2d.canvas.height);
//        context2d.drawImage(buffer.canvas, 0, 0, context2d.canvas.width, context2d.canvas.height);
//        drawBmus();
//        areaSelect.paint(context2d);
//    }


});


