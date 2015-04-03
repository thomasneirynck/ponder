define(["Promise", "./SOM", "./SOMHandle", "require"], function (Promise, SOM, SOMHandle, require) {

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

        makeSOM: function (trainingData, context2d) {

            var dataArray = normalize(trainingData);

            var som = new SOM({
                width: 100,
                height: 100,
                codeBookSize: trainingData[0].length
            });
            som.trainMap(dataArray);
            som.draw(context2d, dataArray);


            return som;

        },

        makeSOMAsync: function (trainingData) {

            var somWorker = new Worker(require.toUrl("ponder") + "/SOMWorker.js");

            var dataArray = normalize(trainingData);
            var width = 100;
            var height = 100;


            somWorker.addEventListener("message", workerLoaded);

            function workerLoaded(event) {


                console.log("done loading worker!", event.data);

                somWorker.removeEventListener("message", workerLoaded);

                var somHandle = new SOMHandle(somWorker, dataArray);
                somHandle.width = width;
                somHandle.height = height;


                somWorker.addEventListener("message", function init(event) {
                    console.log("som initialized", event);
                    somWorker.removeEventListener("message", init);
                    ret.resolve(somHandle);
                });


                somWorker.postMessage({
                    type: "init",
                    trainingData: dataArray,
                    width: width,
                    height: height,
                    codeBookSize: trainingData[0].length
                });

            }


            var ret = new Promise();


            return ret.thenable();
        }

    };


});