require.config({
    baseUrl: ".",
    paths: {
        'ponder': 'src',
        'type': "bower_components/type/type",
        'Promise': "bower_components/Promise/Promise",
        'Evented': "bower_components/Evented/Evented",
        'Papa': "vendor/papaparse",
        '$': "bower_components/jquery/dist/jquery"
    },
    shim: {
        Papa: {
            exports: "Papa",
            init: function () {
                Papa.SCRIPT_PATH = "vendor/papaparse.js";
            }
        },
        $: {
            exports: "$"
        }
    }
});

require([
    "ponder/SOMFactory",
    "Papa",
    "$",
    "ponder/ColorMapper",
    "ponder/ease/EasingInput",
    "ponder/select/AreaSelect"
], function (SOMFactory, Papa, $, ColorMapper, EasingInput, AreaSelect) {


    var somHandle;
    var buffer;
    var context2d;
    var uMatrixData;
    var bufferImageData;
    var bmus;



    var colorMapper = new ColorMapper();
    var areaSelect = new AreaSelect("som");
    areaSelect.on("change", function(){
       console.log("made selection");
    });

    var easingInput = new EasingInput("ease");
    easingInput.on("input", refreshUMatrix);

    document
        .getElementById("fileSelect")
        .addEventListener("change", function listen(event) {
            var file = event.target.files[0];
            if (!file) {
                return;
            }

            Papa.parse(file, {
                worker: true,
                complete: createSom,
                error: function () {
                    alert("cant parse file");
                }
            });
        }, false);


    function throwError(error) {
        throw error;
    }


    function createSom(parsedResult) {

        if (somHandle) {
            somHandle.kill();
            somHandle = null;
            uMatrixData = null;
            bmus = null;
        }

        SOMFactory
            .makeSOMAsync(parsedResult.data)
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
                context2d.canvas.width = $(context2d.canvas).parent().width();
                context2d.canvas.height = $(context2d.canvas).parent().height();

                uMatrixData = successData.uMatrix;

                refreshUMatrix();

                return somHandle.bmus();

            })
            .then(function (bmuResult) {
                console.log("bmu", bmuResult);
                bmus = bmuResult.locations;
                drawMap();
            });
    }

    function refreshUMatrix() {

        if (!uMatrixData) {
            return;
        }

        colorMapper.setEasingParameters(easingInput.getA(), easingInput.getB());
        colorMapper.fillPixelBuffer(uMatrixData, bufferImageData);
        buffer.putImageData(bufferImageData, 0, 0);

        drawMap();
    }


    function drawMap() {
        context2d.drawImage(buffer.canvas, 0, 0, context2d.canvas.width, context2d.canvas.height);

        if (!bmus) {
            return;
        }
        context2d.fillStyle = "rgb(255,255,255)";
        for (var i = 0; i < bmus.length; i += 1) {
            context2d.fillRect(bmus[i].x * context2d.canvas.width / somHandle.width, bmus[i].y * context2d.canvas.height / somHandle.height, 10, 10);
        }
    }


});


