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
        },

        learn: function (feature, i) {
        },

        train: function (dataIterator) {
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
                dist = distance(this._neuralWeights, i, feature, fi,this._codeBookSize);
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

        draw: function (context2d) {

        },

        findXY: function (codebook, i) {
        }

    });


});