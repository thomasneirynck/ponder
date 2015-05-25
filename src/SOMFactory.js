define(["Promise", "./SOMHandle", "require"], function (Promise, SOMHandle, require) {

    function normalize(trainingData) {
        var mins = new Array(trainingData[0].length);
        var maxs = new Array(trainingData[0].length);
        var i, r, c;
        for (i = 0; i < trainingData[0].length; i += 1) {
            mins[i] = Infinity;
            maxs[i] = -Infinity;
        }
        for (r = 0; r < trainingData.length; r += 1) {
            for (c = 0; c < trainingData[r].length; c += 1) {
                mins[c] = Math.min(mins[c], trainingData[r][c]);
                maxs[c] = Math.max(maxs[c], trainingData[r][c]);
            }
        }

        var dataArray = new Array(trainingData.length * trainingData[0].length);
        for (i = 0, r = 0; r < trainingData.length; r += 1) {
            for (c = 0; c < trainingData[r].length; c += 1) {
                dataArray[i++] = (trainingData[r][c] - mins[c]) / (maxs[c] - mins[c]);
            }
        }

        return dataArray;
    }


    return {
        makeSOMAsync: function (trainingData) {

            var somWorker = new Worker(require.toUrl("ponder") + "/SOMWorker.js");
            var somReady = new Promise();

            somWorker.addEventListener("message", function workerLoaded(event) {
                somWorker.removeEventListener("message", workerLoaded);

                var dataArray = normalize(trainingData);
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
                    codeBookSize: trainingData[0].length
                });

            });


            return somReady.thenable();
        }

    };


});