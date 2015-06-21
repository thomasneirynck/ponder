define(["Promise", "./SOMHandle", "require"], function (Promise, SOMHandle, require) {


    return {
        makeSOMAsync: function (dataArray, codebookLength) {

            var somWorker = new Worker(require.toUrl("ponder") + "/worker/SOMWorker.js");
            var somReady = new Promise();

            somWorker.addEventListener("message", function workerLoaded(event) {
                somWorker.removeEventListener("message", workerLoaded);

                var width = 64;
                var height = 64;
                var somHandle = new SOMHandle(somWorker, dataArray);
                somHandle.width = width;
                somHandle.height = height;

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


});