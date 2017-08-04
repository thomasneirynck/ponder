/**{{REQUIREJS_IMPORT}}*/importScripts("../../../bower_components/requirejs/require.js");/**{{REQUIREJS_IMPORT}}*/

require.config({
    baseUrl: "../../..",
    paths: {
        'ponder': 'src',
        'type': "bower_components/type/type",
        'Promise': "bower_components/Promise/Promise",
        'Evented': "bower_components/Evented/Evented"
    }
});

require(["ponder/som/SOM"], function (SOM) {

    var som = null;

    addEventListener("message", function (event) {
        switch (event.data.type) {
            case "init":
                som = new SOM({
                    width: event.data.width,
                    height: event.data.height,
                    codebookWeights: event.data.codebookWeights
                });
                postMessage({
                    type: "initSuccess"
                });
                break;
            case "initFromJson":
                som = new SOM({
                    width: event.data.json.worldWidth,
                    height: event.data.json.worldHeight,
                    codebookWeights: event.data.json.codebookWeights
                });
                som.restoreSOMFromJson(event.data.json);
                postMessage({
                    type: "initFromJsonSuccess"
                });
                break;
            case "dumpToJson":
                var jsonDump = som.dumpSomToJson();
                postMessage({
                    type: "dumpToJsonSuccess",
                    json: jsonDump
                });
                break;
            case "trainMap":
                var handle = som.on("TrainMapProgress", function(percentage){
                    postMessage({
                        type: "trainMapProgress",
                        progress: percentage
                    });
                });
                som.trainMap(event.data.data);
                handle.remove();
                postMessage({
                    type: "trainMapSuccess"
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
                postMessage({
                    type: "statisticsSuccess",
                    statistics: som.statistics(event.data.indices, event.data.data)
                });
        }
    }, false);

    postMessage("worker-loaded");

});