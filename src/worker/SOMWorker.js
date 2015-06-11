importScripts("../../bower_components/requirejs/require.js");

require.config({
    baseUrl: "../..",
    paths: {
        'ponder': 'src',
        'type': "bower_components/type/type",
        'Promise': "bower_components/Promise/Promise"
    }
});

require(["ponder/SOM", "ponder/blueToWhite"], function (SOM, blueToWhite) {

    var som = null;

    addEventListener("message", function (event) {
        switch (event.data.type) {
            case "init":
                som = new SOM({
                    width: event.data.width,
                    height: event.data.height,
                    codeBookSize: event.data.codeBookSize
                });
                postMessage({
                    type: "initSuccess"
                });
                break;
            case "trainMap":
                som.trainMap(event.data.data);
                postMessage({
                    type: "trainMapSucces"
                });
                break;
            case "uMatrixNormalized":
                postMessage({
                    type: "uMatrixNormalizedSuccess",
                    uMatrix: som.uMatrixNormalized()
                });
                break;
            case "interpolate":
                postMessage({
                    type: "interpolateSuccess",
                    values: som.interpolate(event.data.values, event.data.targetWidth, event.data.targetHeight)
                });
                break;
            case "bmus":
                var locations = som.bmus(event.data.data);
                postMessage({
                    type: "bmusSuccess",
                    locations: locations
                });
                break;
            case "statistics":
                var statistics = som.statistics(event.data.data, event.data.indices);
                postMessage({
                    type: "statisticsSuccess",
                    statistics: statistics
                });
        }
    }, false);

    postMessage("worker-loaded");


});