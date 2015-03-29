define(["Promise", "./SOM", "type"], function (Promise, SOM, type) {

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

    var SOMHandle = type({
        constructor: function SOMHandle(somWorker) {
            this._somWorker = somWorker;
            this._somWorker.addEventListener("message", function (event) {

            });
        }


    });


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

            var somWorker = new Worker("./SOMWorker");
            var somHandle = new SOMHandle(somWorker);
            var dataArray = normalize(trainingData);

            somWorker.postMessage({
                type: "init",
                data: {
                    input: dataArray,
                    width: 100,
                    height: 100,
                    codeBookSize: trainingData[0].length
                }
            });

            var ret = new Promise();
            var handle = somWorker.addEventListener("message", function () {
                somWorker.removeEventListener(handle);
                ret.resolve(somHandle);
            });

            return ret.thenable();
        }

    };


});