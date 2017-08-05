define(["Promise", "./SOMHandle"], function (Promise, SOMHandle) {

    var DEFAULT_MAP_WIDTH = 64;
    var DEFAULT_MAP_HEIGHT = 64;

    var somFactory = {
        SCRIPT_PATH: null,


        /**
         * todo: implicatino here is that dataArray matches jsonDump
         * this returns a trained map, irrespective of the dataArray
         * @param dataArray
         * @param jsonDump
         * @return {*}
         */
        makeSOMFromJsonDump: function (dataArray, jsonDump) {

            if (somFactory.SCRIPT_PATH === null && (typeof window.require !== 'function' || typeof window.require.toUrl !== 'function')) {
                throw new Error("Cannot load SOM worker dynamically if require and require.toUrl are not available");
            }

            var somWorker = getSOMWorker();
            var somReady = new Promise();
            somWorker.addEventListener("message", function workerLoaded(event) {
                somWorker.removeEventListener("message", workerLoaded);
                var somHandle = new SOMHandle(somWorker);
                somHandle.setDataArray(dataArray);
                somHandle.setWidthHeight(jsonDump.worldWidth, jsonDump.worldHeight);
                somWorker.addEventListener("message", function init(event) {
                    somWorker.removeEventListener("message", init);
                    somReady.resolve(somHandle);
                });
                somWorker.postMessage({
                    type: "initFromJson",
                    json: jsonDump
                });
            });

            return somReady.thenable();

        },

        /**
         * this returns an untrained map
         * @param dataArray
         * @param codebookWeights
         * @return {*}
         */
        makeSOMAsync: function (dataArray, codebookWeights) {
            var somWorker = getSOMWorker();
            var somReady = new Promise();
            somWorker.addEventListener("message", function workerLoaded(event) {
                somWorker.removeEventListener("message", workerLoaded);
                var somHandle = new SOMHandle(somWorker);
                somHandle.setDataArray(dataArray);
                somHandle.setWidthHeight(DEFAULT_MAP_WIDTH, DEFAULT_MAP_HEIGHT);
                somWorker.addEventListener("message", function init(event) {
                    somWorker.removeEventListener("message", init);
                    somReady.resolve(somHandle);
                });
                somWorker.postMessage({
                    type: "init",
                    trainingData: dataArray,
                    width: DEFAULT_MAP_WIDTH,
                    height: DEFAULT_MAP_HEIGHT,
                    codebookWeights: codebookWeights
                });
            });

            return somReady.thenable();
        }

    };


    function getSOMWorker() {

        if (somFactory.SCRIPT_PATH === null && (typeof window.require !== 'function' || typeof window.require.toUrl !== 'function')) {
            throw new Error("Cannot load SOM worker dynamically if require and require.toUrl are not available");
        }

        var foobarScript = somFactory.SCRIPT_PATH === null ? window.require.toUrl("ponder") + "/som/worker/SOMWorker.js" : somFactory.SCRIPT_PATH;

        //!!!! this function must be replaced with worker content by build process MUST BE ON ONE LINE!!!!!!!!!
        var somWorker = /*!keep_this*/(function foobarWorker() {return new Worker(foobarScript);}());/*!keep_this*/

        return somWorker;
    }


    return somFactory;



});

