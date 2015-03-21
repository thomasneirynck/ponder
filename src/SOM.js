define(['Promise',
    "type"
], function (Promise, type) {

    function between(x, s, e) {
        return x >= s && x <= e;
    }

    function testDistention(t, b, c, d) {
        var ts=(t/=d)*t;
        var tc=ts*t;
        return b+c*(tc*ts + -5*ts*ts + 10*tc + -10*ts + 5*t);
    }

    function ease(t) {
        return t;
//        return 1+(--t)*t*t*t*t ;
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

            this._mapRadius = Math.max(this._width, this._height) / 2;
            this._initialLearningRate = 0.5;
        },

        learn: function (sampleData, fi, ni, learningRate, distance, neighbourhoodDistance) {
            var influence = 1 - (distance / neighbourhoodDistance);
//            var influence = Math.exp(- Math.pow(distance,2)/ (Math.pow(neighbourhoodDistance,2)));
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

        trainMap: function (sampleData) {
//            var iterationLimit = this._width * this._height;
            var iterationLimit = 10;
            var bmu = {i: 0, x: 0, y: 0};
            var learningRate, neighbourhoodDistance, s, t;
            for (s = 0; s < iterationLimit; s += 1) {//timesteps
                learningRate = this.learningRate(s, iterationLimit);
                neighbourhoodDistance = this.neighbourhoodDistance(s, iterationLimit);
                for (t = 0; t < sampleData.length; t += this._codeBookSize) {
                    this.train(sampleData, t, learningRate, neighbourhoodDistance, bmu);
                }
            }
        },

        distance: function (vector1, i1, vector2, i2) {
            var sum = 0;
            for (var i = 0; i < this._codeBookSize; i += 1) {
                sum += Math.pow(vector1[i1 + i] - vector2[i2 + i], 2)
            }
            return sum;
        },

        learningRate: function (s, iterationLimit) {
            return this._initialLearningRate * (iterationLimit - s) / iterationLimit;

//            return this._initialLearningRate * Math.exp(- Math.pow(s,2)/ (Math.pow(iterationLimit,2)));
        },

        neighbourhoodDistance: function (s, iterationLimit) {
            return this._mapRadius * (iterationLimit - s) / iterationLimit;
//            return this._mapRadius * Math.exp(- Math.pow(s,2)/ (Math.pow(iterationLimit,2)));
        },

        toIndex: function (x, y) {
            return ((this._width * x) + y) * this._codeBookSize;
        },

        toXY: function (index, out) {
            out.y = Math.floor(index / this._codeBookSize / this._width);
            out.x = (index / this._codeBookSize) % this._width;
        },


        jiggerBMU: function (feature, fi, x, y, out) {

            var dx = 0;
            var dy = 0;
            var i;

            var total = 0;
            //up down top left
            if (between(x - 1, 0, this._width)) {
                i = this.toIndex(x - 1, y);
                dx -= (1 - this.distance(this._neuralWeights, i, feature, fi) / this._codeBookSize);
                total += 1;
            }
            if (between(x + 1, 0, this._width)) {
                i = this.toIndex(x + 1, y);
                dx += (1 - this.distance(this._neuralWeights, i, feature, fi) / this._codeBookSize);
                total += 1;
            }

            if (between(y - 1, 0, this._height)) {
                i = this.toIndex(x, y - 1);
                dy -= (1 - this.distance(this._neuralWeights, i, feature, fi) / this._codeBookSize);
                total += 1;
            }

            if (between(y + 1, 0, this._height)) {
                i = this.toIndex(x, y + 1);
                dy += (1 - this.distance(this._neuralWeights, i, feature, fi) / this._codeBookSize);
                total += 1;
            }
//
//            //diagonal
//            var d;
//            if (between(x - 1, 0, this._width) && between(y - 1, 0, this._height)) {
//                i = this.toIndex(x - 1, y - 1);
//                d = ease(1 - (this.distance(this._neuralWeights, i, feature, fi) / this._codeBookSize) / 1.4142135623730951);
//                dx -= d;
//                dy -= d;
//                total += 1;
//            }
//            if (between(x - 1, 0, this._width) && between(y + 1, 0, this._height)) {
//                i = this.toIndex(x - 1, y + 1);
//                d = ease(1 - (this.distance(this._neuralWeights, i, feature, fi) / this._codeBookSize) / 1.4142135623730951);
//                dx -= d;
//                dy += d;
//                total += 1;
//            }
//            if (between(x + 1, 0, this._width) && between(y - 1, 0, this._height)) {
//                i = this.toIndex(x + 1, y - 1);
//                d = ease(1 - (this.distance(this._neuralWeights, i, feature, fi) / this._codeBookSize) / 1.4142135623730951);
//                dx += d;
//                dy -= d;
//                total += 1;
//            }
//            if (between(x + 1, 0, this._width) && between(y + 1, 0, this._height)) {
//                i = this.toIndex(x + 1, y + 1);
//                d = ease(1 - (this.distance(this._neuralWeights, i, feature, fi) / this._codeBookSize) / 1.4142135623730951);
//                dx += d;
//                dy += d;
//                total += 1;
//            }
            out.jx = x + ease(dx /total);
            out.jy = y + ease(dy /total);

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