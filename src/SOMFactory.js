define(["Promise", "./SOM"], function (Promise, SOM) {


    return {

        makeSOM: function (trainingData, context2d) {

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


            i = 0;
            for (r = 0; r < trainingData.length; r += 1) {
                for (c = 0; c < trainingData[r].length; c += 1) {
                    dataArray[i++] = (trainingData[r][c] - mins[c]) / (maxs[c] - mins[c]);
                }
            }

            var som = new SOM({
                width: 100,
                height: 100,
                codeBookSize: trainingData[0].length
            });
            som.trainMap(dataArray);
            som.draw(context2d, dataArray);


            return som;

        }

    };


});