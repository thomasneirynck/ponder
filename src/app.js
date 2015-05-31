require.config({
    baseUrl: ".",
    paths: {
        'ponder': 'src',
        'type': "bower_components/type/type",
        'Promise': "bower_components/Promise/Promise",
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

require(["ponder/SOMFactory",
    "Papa", "$", "ponder/ColorMapper"], function (SOMFactory, Papa, $, ColorMapper) {

    document
        .getElementById("fileSelect")
        .addEventListener("change", function listen(event) {
            var file = event.target.files[0];
            if (!file) {
                return;
            }

            document.getElementById("fileSelect").removeEventListener("change", listen);
            $("#fileSelect").hide();

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


    var somHandle;
    var buffer;
    var context2d;
    var uMatrixData;
    var bufferImageData;

    var colorMapper = new ColorMapper();
    var xslide = document.getElementById("xslide");
    var yslide = document.getElementById("yslide");
    xslide.addEventListener("input", drawUmatrix);
    yslide.addEventListener("input", drawUmatrix);

    function createSom(parsedResult) {

        SOMFactory
            .makeSOMAsync(parsedResult.data)
            .then(function (aSomHandle) {
                somHandle = aSomHandle;
                console.log("train map");
                return somHandle.trainMap();
            }, throwError)
            .then(function () {
                return somHandle.uMatrixNormalized();
            })
            .then(function (successData) {

                context2d = document.getElementById("som").getContext("2d");
                context2d.canvas.width = $(context2d.canvas).parent().width();
                context2d.canvas.height = $(context2d.canvas).parent().height();

                buffer = document.createElement("canvas").getContext("2d");
                buffer.canvas.width = somHandle.width;
                buffer.canvas.height = somHandle.height;

                bufferImageData = buffer.getImageData(0, 0, buffer.canvas.width, buffer.canvas.height);

                uMatrixData = successData.uMatrix;


                drawUmatrix();

            });

    }

    function drawUmatrix() {

        if (!uMatrixData) {
            return;
        }

        colorMapper.setEasingParameters(xslide.value, yslide.value);
        colorMapper.fillPixelBuffer(uMatrixData, bufferImageData);
        buffer.putImageData(bufferImageData, 0, 0);
        context2d.drawImage(buffer.canvas, 0, 0, context2d.canvas.width, context2d.canvas.height);
    }

});


