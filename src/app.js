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
    "Promise", "Papa", "$"], function (SOMFactory, Promise, Papa, $) {

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

    function createSom(parsedResult) {

        var context2d = document.getElementById("som").getContext("2d");
        context2d.canvas.width = $(context2d.canvas).parent().width();
        context2d.canvas.height = $(context2d.canvas).parent().height();


        SOMFactory
            .makeSOMAsync(parsedResult.data)
            .then(function (somHandle) {
                somHandle.trainMap();
                return {
                    somHandle: somHandle
                };
            })
            .then(function (state) {

                var buffer = document.createElement("canvas").getContext("2d");
                buffer.canvas.width = state.somHandle.width;
                buffer.canvas.height = state.somHandle.height;

                var bufferImageData = buffer.getImageData(0, 0, buffer.canvas.width, buffer.canvas.height);

                return Promise
                    .when(state.somHandle.uMatrix(bufferImageData))
                    .then(function (data) {
                        state.pixelBuffer = data.pixelBuffer;
                        state.buffer = buffer;
                        return state;
                    });

            })
            .then(function (state) {
                state.buffer.putImageData(state.pixelBuffer, 0, 0);
                context2d.drawImage(state.buffer.canvas, 0, 0, context2d.canvas.width, context2d.canvas.height);
                return Promise.when(state.somHandle.bmus())
                    .then(function (data) {
                        state.locations = data.locations;
                        return state;
                    });
            })
            .then(function (state) {
                var sx = context2d.canvas.width / state.somHandle.width;
                var sy = context2d.canvas.height / state.somHandle.height;
                var size = 2;
                context2d.fillStyle = "rgb(255,255,255)";
                for (var i = 0; i < state.locations.length; i += 1) {
                    context2d.fillRect(state.locations[i].x * sx - size / 2, state.locations[i].y * sy - size / 2, size, size);
                }
            });

    }

});


