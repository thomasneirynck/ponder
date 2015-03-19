define(["type"], function (type) {


    return type({

        constructor: function SOM(options) {

            this._width = options.width;
            this._height = options.height;
            this._codeBookSize = options.codeBookSize;
            this._neuralWeights = new Array(this._width * this._height * this._codeBookSize);

            for (var i = 0; i < this._neuralWeights.length; i += 1) {
                this._neuralWeights[i] = Math.random();
            }

            this._mapRadius = Math.max(this._width, this._height) / 2;
            this._initialLearningRate = 0.5;
        },

        learn: function (sampleData, fi, ni, learningRate, distance, neighboorhoodDistance) {
            var influence = 1 - (distance / neighboorhoodDistance);
            var error;
            for (var i = 0; i < this._codeBookSize; i += 1) {
                error = sampleData[fi + i] - this._neuralWeights[ni + i];
                this._neuralWeights[ni + i] = this._neuralWeights[ni + i] + learningRate * influence * error;
            }
        },

        train: function (sampleData, fi, learningRate, neighbourhoodDistance, bmu) {

            this.bmu(sampleData, fi, bmu);

            var i, dist;
            var cstart = Math.max(Math.floor(bmu.x - neighbourhoodDistance), 0);
            var cend = Math.min(Math.ceil(bmu.x + neighbourhoodDistance), this._width);
            var rstart = Math.max(Math.floor(bmu.y - neighbourhoodDistance), 0);
            var rend = Math.min(Math.ceil(bmu.y + neighbourhoodDistance), this._height);
            for (var c = cstart; c < cend; c += 1) {
                for (var r = rstart; r < rend; r += 1) {
                    i = this.toIndex(c, r);
                    dist = Math.sqrt(Math.pow(c - bmu.x, 2) + Math.pow(r - bmu.y, 2));
                    if (dist <= neighbourhoodDistance) {
                        this.learn(sampleData, fi, i, learningRate, dist, neighbourhoodDistance);
                    }
                }
            }

        },

        trainMap: function (sampleData,onCycle) {
            var iterationLimit = 10;
            var bmu = {i: 0, x: 0, y: 0};
            var learningRate, neighbourhoodDistance, s, t;
            for (s = 0; s < iterationLimit; s += 1) {//timesteps
                learningRate = this.learningRate(s, iterationLimit);
                neighbourhoodDistance = this.neighbourhoodDistance(s, iterationLimit);
                for (t = 0; t < sampleData.length; t += this._codeBookSize) {
                    this.train(sampleData, t, learningRate, neighbourhoodDistance, bmu);
                }
                onCycle();
            }
        },

        distance: function (vector1, i1, vector2, i2) {
            var sum = 0;
            for (var i = 0; i < this._codeBookSize; i += 1) {
                sum += Math.pow(vector1[i1 + i] - vector2[i2 + i], 2)
            }
            return Math.sqrt(sum);
        },

        learningRate: function (s, iterationLimit) {
            return this._initialLearningRate * (iterationLimit - s) / iterationLimit;
        },

        neighbourhoodDistance: function (s, iterationLimit) {
            return this._mapRadius * (iterationLimit - s) / iterationLimit;
        },

        toIndex: function (x, y) {
            return ((this._width * x) + y) * this._codeBookSize;
        },

        toXY: function (index, out) {
            out.x = Math.floor(index / this._codeBookSize / this._width);
            out.y = (index / this._codeBookSize) % this._width;
        },

        bmu: function (feature, fi, out) {
            var minDistance = Infinity;
            var minI, dist;
            for (var i = 0; i < this._neuralWeights.length; i += this._codeBookSize) {
                dist = this.distance(this._neuralWeights, i, feature, fi, this._codeBookSize);
                if (dist < minDistance) {
                    minDistance = dist;
                    minI = i;
                }
            }
            out.i = minI;
            this.toXY(minI, out);
        },

        fill2dImageData: function (imgData, mapNeuronToPixel) {
            for (var i = 0, pixeli = 0; i < this._neuralWeights.length; i += this._codeBookSize, pixeli += 4) {
                mapNeuronToPixel(this._neuralWeights, i, imgData.data, pixeli);
            }
        },

        findXY: function (codebook, i) {
        }

    });


});