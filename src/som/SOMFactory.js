define(["Promise", "./SOMHandle", "require"], function (Promise, SOMHandle, require) {


    var somFactory = {
        SCRIPT_PATH: null,
        makeSOMAsync: function (dataArray, codebookLength) {
            var script = somFactory.SCRIPT_PATH === null ? require.toUrl("ponder") + "/som/worker/SOMWorker.js" : somFactory.SCRIPT_PATH;
            var somWorker = new Worker(script);
            var somReady = new Promise();

            somWorker.addEventListener("message", function workerLoaded(event) {
                somWorker.removeEventListener("message", workerLoaded);

                var width = 64;
                var height = 64;
                var somHandle = new SOMHandle(somWorker, dataArray, width, height);


                somWorker.addEventListener("message", function init(event) {
                    somWorker.removeEventListener("message", init);
                    somReady.resolve(somHandle);
                });
                somWorker.postMessage({
                    type: "init",
                    trainingData: dataArray,
                    width: width,
                    height: height,
                    codeBookSize: codebookLength
                });

            });

            return somReady.thenable();
        }

    };

    return somFactory;
});