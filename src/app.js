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
    "ponder/SOMFactory",
    "Papa",
    "jquery",
    "ponder/ColorMapper",
    "ponder/ease/EasingInput",
    "ponder/select/AreaSelect",
    "ponder/DataSelector",
    "ponder/DataTable",
    "ponder/SummaryChart",
    "datatables"
], function (SOMFactory, Papa, jquery, ColorMapper, EasingInput, AreaSelect, DataSelector, DataTable, SummaryChart, datatables) {


    var somHandle;
    var buffer;
    var context2d;
    var uMatrixData;
    var bufferImageData;
    var bmus;
    var dataTable;
    var selectElement;


    var colorMapper = new ColorMapper();
    var areaSelect = new AreaSelect("som");
    areaSelect.on("change", function () {

        if (!bmus) {
            return;
        }

        var selectedIndices = [];
        for (var i = 0; i < bmus.length; i += 1) {
            if (areaSelect.isInsideSelectedArea(toViewX(bmus[i].x), toViewY(bmus[i].y))) {
                selectedIndices.push(i);
            }
        }


        somHandle
            .statistics(selectedIndices)
            .then(function (stats) {


                var data = stats.getIndices().map(function (index) {
                    return dataTable.getFeatureData(index);
                });


                document.getElementById("table").innerHTML = "";

                var table = document.createElement("table");
                table.cellpadding = 0;
                table.cellspacing = 0;
                table.border = 0;
                table.class = "display";
                document.getElementById("table").appendChild(table);

                jquery(table).dataTable({
                    searching: true,
                    ordering: true,
                    paging: true,
                    "data": data,
                    "columns": dataTable.getColumns().map(function (e) {
                        return {
                            title: e
                        };
                    })
                });


                document.getElementById("summary").innerHTML = "";
                var summary = new SummaryChart("summary", stats.getMins(), stats.getMaxs(), dataTable.getSelectedColumns());


            }, function (e) {
                throw e;
            }).then(Function.prototype, function (e) {
                throw e;
            });

        invalidate();
    });

    areaSelect.on("input", invalidate);

    var easingInput = new EasingInput("ease");
    easingInput.on("input", refreshUMatrix);

    var dataSelector = new DataSelector("selector");
    dataSelector.on("change", function (event) {

        dataSelector.destroy();

        dataTable = new DataTable(event.data, event.columns, event.selectedColumns);
        var dataArray = dataTable.createDataArray();

        createSom(dataArray, event.selectedColumns.length);

        var selectTag = $("<select />");
        for (var index in event.columns) {
            $("<option />", {value: index, text: event.columns[index]}).appendTo(selectTag);
        }

        selectTag.appendTo("#label");
        selectTag.on("change", invalidate);
        selectElement = selectTag[0];

        invalidate();

    });


    function throwError(error) {
        throw error;
    }


    function createSom(dataArray, codebookLength) {

        if (somHandle) {
            somHandle.kill();
            somHandle = null;
            uMatrixData = null;
            bmus = null;
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

                buffer = document.createElement("canvas").getContext("2d");
                buffer.canvas.width = somHandle.width;
                buffer.canvas.height = somHandle.height;
                bufferImageData = buffer.getImageData(0, 0, buffer.canvas.width, buffer.canvas.height);

                context2d = document.getElementById("som").getContext("2d");
                resize();

                uMatrixData = successData.uMatrix;

                refreshUMatrix();
                invalidate();


                return somHandle.bmus();

            })
            .then(function (bmuResult) {
                bmus = bmuResult.locations;
                invalidate();
            });
    }

    window.addEventListener("resize", resize);

    function resize() {
        if (!context2d) {
            return;
        }
        context2d.canvas.width = jquery(context2d.canvas).parent().width();
        context2d.canvas.height = jquery(context2d.canvas).parent().height();
        invalidate();
    }

    function refreshUMatrix() {

        if (!uMatrixData) {
            return;
        }

        colorMapper.setEasingParameters(easingInput.getA(), easingInput.getB());
        colorMapper.fillPixelBuffer(uMatrixData, bufferImageData);
        buffer.putImageData(bufferImageData, 0, 0);

        invalidate();
    }

    function toViewX(x) {
        return x * context2d.canvas.width / somHandle.width;
    }

    function toViewY(y) {
        return y * context2d.canvas.height / somHandle.height;
    }

    function toSomX(x) {
        return x * somHandle.width / context2d.canvas.width;
    }

    function toSomY(y) {
        return y * somHandle.height / context2d.canvas.height;
    }


    function drawMap() {
        context2d.drawImage(buffer.canvas, 0, 0, context2d.canvas.width, context2d.canvas.height);
        drawLabels();
    }

    function drawLabels() {
        if (!bmus) {
            return;
        }
        context2d.fillStyle = "rgb(255,255,255)";
        for (var i = 0; i < bmus.length; i += 1) {
            context2d.fillRect(toViewX(bmus[i].x), toViewY(bmus[i].y), 10, 10);
            context2d.fillText(dataTable.getValueByRowAndColumnIndex(i, selectElement.value), toViewX(bmus[i].x), toViewY(bmus[i].y));
        }
    }


    var handle = null;

    function invalidate() {
        if (!handle) {
            handle = requestAnimationFrame(draw);
        }
    }


    function draw() {
        handle = null;
        if (!context2d) {
            return;
        }
        context2d.clearRect(0, 0, context2d.canvas.width, context2d.canvas.height);
        drawMap();
        areaSelect.paint(context2d);
        invalid = false;
    }

});


