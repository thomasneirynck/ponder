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

   
    var somHandle;
    var buffer;
    var context2d;

    function createSom(parsedResult) {

        SOMFactory
            .makeSOMAsync(parsedResult.data)
            .then(function (aSomHandle) {
                somHandle = aSomHandle;
                console.log("train map");
                return somHandle.trainMap();
            }, throwError)
            .then(function () {

                buffer = document.createElement("canvas").getContext("2d");
                buffer.canvas.width = somHandle.width;
                buffer.canvas.height = somHandle.height;

                var bufferImageData = buffer.getImageData(0, 0, buffer.canvas.width, buffer.canvas.height);

                console.log("do umatrix");
                return somHandle.uMatrix(bufferImageData)

            }, throwError)
            .then(function (data) {

                context2d = document.getElementById("som").getContext("2d");
                context2d.canvas.width = $(context2d.canvas).parent().width();
                context2d.canvas.height = $(context2d.canvas).parent().height();

                buffer.putImageData(data.pixelBuffer, 0, 0);
                context2d.drawImage(buffer.canvas, 0, 0, context2d.canvas.width, context2d.canvas.height);

                console.log("do bmus");
                return somHandle.bmus();

            }, throwError)
            .then(function (data) {
                var sx = context2d.canvas.width / somHandle.width;
                var sy = context2d.canvas.height / somHandle.height;
                var size = 2;
                context2d.fillStyle = "rgb(255,255,255)";
                console.log("draw bmus", data.locations);
                for (var i = 0; i < data.locations.length; i += 1) {
                    context2d.fillRect(data.locations[i].x * sx - size / 2, data.locations[i].y * sy - size / 2, size, size);

                }
                console.log("done with the bmus");
            }, throwError);

    }

});


