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
            initinit: function () {
                Papa.SCRIPT_PATH = "vendor/papaparse.js";
            }
        },
        $: {
            exports: "$"
        }
    }
});

require(["ponder/SOMFactory",
    "Papa", "$"], function (SOMFactory, Papa, $) {

    document
        .getElementById("fileSelect")
        .addEventListener("change", function listen(event) {
            var file = event.target.files[0];
            if (!file) {
                return;
            }

            document.getElementById("fileSelect").remove("change", listen);
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

    var APP_STATE = {};

    function createSom(parsedResult) {

        SOMFactory
            .makeSOMAsync(parsedResult.data)
            .then(function (somHandle) {
                APP_STATE.somHandle = somHandle;
                return somHandle.trainMap();
            }, throwError)
            .then(function () {

                APP_STATE.buffer = document.createElement("canvas").getContext("2d");
                APP_STATE.buffer.canvas.width = APP_STATE.somHandle.width;
                APP_STATE.buffer.canvas.height = APP_STATE.somHandle.height;

                var bufferImageData = APP_STATE.buffer.getImageData(0, 0, APP_STATE.buffer.canvas.width, APP_STATE.buffer.canvas.height);

                return APP_STATE.somHandle.uMatrix(bufferImageData)

            }, throwError)
            .then(function (data) {

                APP_STATE.context2d = document.getElementById("som").getContext("2d");
                APP_STATE.context2d.canvas.width = $(APP_STATE.context2d.canvas).parent().width();
                APP_STATE.context2d.canvas.height = $(APP_STATE.context2d.canvas).parent().height();

                APP_STATE.buffer.putImageData(data.pixelBuffer, 0, 0);
                APP_STATE.context2d.drawImage(APP_STATE.buffer.canvas, 0, 0, APP_STATE.context2d.canvas.width, APP_STATE.context2d.canvas.height);

                return APP_STATE.somHandle.bmus();

            }, throwError)
            .then(function (data) {
                var sx = APP_STATE.context2d.canvas.width / APP_STATE.somHandle.width;
                var sy = APP_STATE.context2d.canvas.height / APP_STATE.somHandle.height;
                var size = 2;
                APP_STATE.context2d.fillStyle = "rgb(255,255,255)";
                for (var i = 0; i < data.locations.length; i += 1) {
                    APP_STATE.context2d.fillRect(data.locations[i].x * sx - size / 2, data.locations[i].y * sy - size / 2, size, size);
                }
            }, throwError);

    }

});


