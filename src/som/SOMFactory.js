define(["Promise", "./SOMHandle"], function (Promise, SOMHandle) {

    var somFactory = {
        SCRIPT_PATH: null,
        makeSOMAsync: function (dataArray, codeBookWeights) {


            if (somFactory.SCRIPT_PATH === null && (typeof window['require'] !== 'function' || typeof window['require'].toUrl !== 'function')) {
                throw new Error("Cannot load SOM worker dynamically if require and require.toUrl are not available");
            }
            console.log('require;', window['require'], window['require'].toUrl);
            var script = somFactory.SCRIPT_PATH === null ? window['require'].toUrl("ponder") + "/som/worker/SOMWorker.js" : somFactory.SCRIPT_PATH;


            var somWorker = new Worker(script);
            var somReady = new Promise();

            somWorker.addEventListener("message", function workerLoaded(event) {
                somWorker.removeEventListener("message", workerLoaded);

                var mapWidth = 64;
                var mapHeight = 64;
                var somHandle = new SOMHandle(somWorker, dataArray, mapWidth, mapHeight);


                somWorker.addEventListener("message", function init(event) {
                    somWorker.removeEventListener("message", init);
                    somReady.resolve(somHandle);
                });
                somWorker.postMessage({
                    type: "init",
                    trainingData: dataArray,
                    width: mapWidth,
                    height: mapHeight,
                    codeBookWeights: codeBookWeights
                });

            });

            return somReady.thenable();
        }

    };

    return somFactory;
});