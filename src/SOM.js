define(["type"], function (type) {

    function compareLowest() {

    }


    compareLowest.feature = null;
    compareLowest.i = -1;

    function distance(vector1, i1, vector2, i2, codebookSize) {
        var sum = 0;
        for (var i = 0; i < codebookSize; i += 1) {
            sum += Math.pow(vector1[i1 + i] - vector2[i2 + i], 2)
        }
        return Math.sqrt(sum);
    }

    return type({

        constructor: function SOM(options) {

            this._width = options.width;
            this._height = options.height;
            this._codeBookSize = options.codeBookSize;
            this._neuralWeights = new Array(this._width * this._height * this._codeBookSize);

            for (var i = 0; i < this._neuralWeights.length; i += 1) {
                this._neuralWeights[i] = Math.random();
            }

//            this._iterationNumber = 800;
            this._learningRate = 1;
            this._neighbourRate = 1;
            this._mapRadius = Math.max(this._width, this._height) / 2;
//            this._timeConstant = this._iterationNumber / Math.log(this._mapRadius);
            this._initialiLearningRate = 0.5;

        },

//        train: function (x, y, feature, fi) {
//            for (var c = x - this._mapRadius; c < x + this._mapRadius; c += 1) {
//                for (var r = x - this._mapRadius; r < y + this._mapRadius; r += 1) {
//
//                }
//            }
//        },

        trainMap: function (sampleData) {


            var iterationLimit = this._width * this._height * this._codeBookSize;

            for (var s = 0; s < iterationLimit; s += 1) {//timesteps
               for (var t = 0; t <sampleData.length; t += this._codeBookSize){

               } 
            }
        },

        learningRate: function (s, iterationLimit) {
            return this._initialiLearningRate * (iterationLimit - s) / iterationLimit;
        },

        neighbourhoodDistance: function (s, iterationLimit) {
            return this._mapRadius *  (iterationLimit - s) / iterationLimit;
        },

        reduceCodeBook: function (fold, accumulator) {
            var x, y;
            for (var i = 0; i < this._neuralWeights.length; i += this._codeBookSize) {
                accumulator = fold(accumulator, this._neuralWeights, x, y, this._codeBookSize);
            }
            return accumulator;
        },

        toIndex: function (x, y) {
            return ((this._width * x) + y) * this._codeBookSize;
        },

        bmu: function (feature, fi, out) {
            var minDistance = Infinity;
            var minI, dist;
            for (var i = 0; i < this._neuralWeights.length; i += this._codeBookSize) {
                dist = distance(this._neuralWeights, i, feature, fi, this._codeBookSize);
                if (dist < minDistance) {
                    minDistance = dist;
                    minI = i;
                }
            }
            out.i = minI;
            out.x = Math.floor(minI / this._codeBookSize / this._width);
            out.y = (minI / this._codeBookSize) % this._width;
        },

        distance: function (codebook, i) {
        },

        write: function () {
        },

        draw: function (context2d, mapNeuronToPixel) {

        },

        findXY: function (codebook, i) {
        }

    });


});