define([
    "type",
    "../Random",
    "Evented"
], function (type, Random, Evented) {


    //can be replaced with Math.random() if we don't want seeding
    var random = Random(1);

    function between(x, s, e) {
        return x >= s && x < e;
    }

    function sign(n) {
        return n >= 0 ? 1 : -1;
    }

    function ease(t) {
        return t;
    }


    function toIndex(x, y, width, size) {
        return ((width * y) + x) * size;
    }

    function calculateBilinearInterpolant(x1, x, x2, y1, y, y2, Q11, Q21, Q12, Q22) {

        //taken from https://www.khanacademy.org/computer-programming/bilinear-interpolation-calculator/5137979113734144
        /**
         * (x1, y1) - coordinates of corner 1 - [Q11]
         * (x2, y1) - coordinates of corner 2 - [Q21]
         * (x1, y2) - coordinates of corner 3 - [Q12]
         * (x2, y2) - coordinates of corner 4 - [Q22]
         *
         * (x, y)   - coordinates of interpolation
         *
         * Q11      - corner 1
         * Q21      - corner 2
         * Q12      - corner 3
         * Q22      - corner 4
         */

        var ans1 = (((x2 - x) * (y2 - y)) / ((x2 - x1) * (y2 - y1))) * Q11;
        var ans2 = (((x - x1) * (y2 - y)) / ((x2 - x1) * (y2 - y1))) * Q21;
        var ans3 = (((x2 - x) * (y - y1)) / ((x2 - x1) * (y2 - y1))) * Q12;
        var ans4 = (((x - x1) * (y - y1)) / ((x2 - x1) * (y2 - y1))) * Q22;
        return (ans1 + ans2 + ans3 + ans4);
    }

    return type(Evented.prototype, {

        constructor: function SOM(options) {

            Evented.call(this);

            this._worldWidth = options.width;
            this._worldHeight = options.height;
            this._codebookWeights = options.codebookWeights;

            this._neuralWeights = new Array(this._worldWidth * this._worldHeight * this._codebookWeights.length);

            for (var i = 0; i < this._neuralWeights.length; i += 1) {
                this._neuralWeights[i] = random();
            }

            this._mapRadius = Math.max(this._worldWidth, this._worldHeight) / 2;
            this._initialLearningRate = 0.5;
        },

        restoreSOMFromJson: function (somConfig) {
            this._worldWidth = somConfig.worldWidth;
            this._worldHeight = somConfig.worldHeight;
            this._codebookWeights = somConfig.codebookWeights;
            this._neuralWeights = somConfig.neuralWeights;
            this._mapRadius = somConfig.mapRadius;
            this._initialLearningRate = somConfig.initialLearningRate;
        },

        dumpSomToJson: function () {
            return {
                worldWidth: this._worldWidth,
                worldHeight: this._worldHeight,
                codebookWeights: this._codebookWeights.slice(),
                neuralWeights: this._neuralWeights.slice(),
                mapRadius: this._mapRadius,
                initialLearningRate: this._initialLearningRate
            };
        },

        uMatrixNormalized: function () {

            var xy = {x: 0, y: 0};
            var distance, total, ni, i;
            var min = Infinity;
            var max = -Infinity;
            var uMatrix = new Array(this._worldWidth * this._worldHeight);
            for (i = 0; i < this._neuralWeights.length; i += this._codebookWeights.length) {

                distance = 0;
                total = 0;
                this.toXY(i, xy);

                if (between(xy.x - 1, 0, this._worldWidth)) {
                    ni = this.toIndex(xy.x - 1, xy.y);
                    distance += (this.distance(this._neuralWeights, i, this._neuralWeights, ni) / this._codebookWeights.length);
                    total += 1;
                }
                if (between(xy.x + 1, 0, this._worldWidth)) {
                    ni = this.toIndex(xy.x + 1, xy.y);
                    distance += (this.distance(this._neuralWeights, i, this._neuralWeights, ni) / this._codebookWeights.length);
                    total += 1;
                }
                if (between(xy.y - 1, 0, this._worldHeight)) {
                    ni = this.toIndex(xy.x, xy.y - 1);
                    distance += (this.distance(this._neuralWeights, i, this._neuralWeights, ni) / this._codebookWeights.length);
                    total += 1;
                }
                if (between(xy.y + 1, 0, this._worldHeight)) {
                    ni = this.toIndex(xy.x, xy.y + 1);
                    distance += (this.distance(this._neuralWeights, i, this._neuralWeights, ni) / this._codebookWeights.length);
                    total += 1;
                }

                uMatrix[i / this._codebookWeights.length] = distance / total;
                min = Math.min(min, uMatrix[i / this._codebookWeights.length]);
                max = Math.max(max, uMatrix[i / this._codebookWeights.length]);
            }

            for (i = 0; i < uMatrix.length; i += 1) {
                uMatrix[i] = (uMatrix[i] - min) / (max - min);
            }

            return uMatrix;

        },

        learn: function (sampleData, fi, ni, learningRate, distance, neighbourhoodDistance) {
            var influence = 1 - (distance / neighbourhoodDistance);
            var error;
            for (var i = 0; i < this._codebookWeights.length; i += 1) {
                error = sampleData[fi + i] - this._neuralWeights[ni + i];
                this._neuralWeights[ni + i] = this._neuralWeights[ni + i] + learningRate * influence * error;
            }
        },


        train: function (sampleData, fi, learningRate, neighbourhoodDistance, bmu) {

            this.bmu(sampleData, fi, bmu);

            var i, dist;
            var cstart = Math.max(Math.floor(bmu.x - neighbourhoodDistance), 0);
            var cend = Math.min(Math.ceil(bmu.x + neighbourhoodDistance), this._worldWidth);
            var rstart = Math.max(Math.floor(bmu.y - neighbourhoodDistance), 0);
            var rend = Math.min(Math.ceil(bmu.y + neighbourhoodDistance), this._worldHeight);
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

        /**
         * interpolate values (e.g. u matrix values), with th
         * @param values array of values. must be same shape as SOM
         * @param targetWidth
         * @param targetHeight
         * @returns {Array}
         */
        interpolate: function (values, targetWidth, targetHeight) {


            var interpolated = new Array(targetWidth * targetHeight);
            var x1, x, x2, y1, y, y2, Q11, Q21, Q12, Q22;

            //do row by row, so we fill in the data sequentially (iso. jump around in the array)
            for (var r = 0; r < targetHeight; r += 1) {
                for (var c = 0; c < targetWidth; c += 1) {

                    x = c * (this._worldWidth - 1) / (targetWidth - 1);
                    y = r * (this._worldHeight - 1) / (targetHeight - 1);

                    x1 = Math.min(Math.floor(x), this._worldWidth - 2);
                    x2 = x1 + 1;
                    y1 = Math.min(Math.floor(y), this._worldHeight - 2);
                    y2 = y1 + 1;

                    Q11 = values[toIndex(x1, y1, this._worldWidth, 1)];
                    Q12 = values[toIndex(x1, y2, this._worldWidth, 1)];
                    Q21 = values[toIndex(x2, y1, this._worldWidth, 1)];
                    Q22 = values[toIndex(x2, y2, this._worldWidth, 1)];

                    interpolated[(targetWidth * r) + c] = calculateBilinearInterpolant(x1, x, x2, y1, y, y2, Q11, Q12, Q21, Q22);
                }
            }

            return interpolated;

        },

        trainMap: function (sampleData) {
            var iterationLimit = 16;
            var bmu = {i: 0, x: 0, y: 0};
            var learningRate, neighbourhoodDistance, s, t;

            for (s = 0; s < iterationLimit; s += 1) {//timesteps
                learningRate = this.learningRate(s, iterationLimit);
                neighbourhoodDistance = this.neighbourhoodDistance(s, iterationLimit);
                for (t = 0; t < sampleData.length; t += this._codebookWeights.length) {
                    this.train(sampleData, t, learningRate, neighbourhoodDistance, bmu);
                }
                this.emit("TrainMapProgress", (s + 1) / iterationLimit);
            }
        },

        dot: function (vector1, i1, vector2, i2) {
            var sum = 0;
            for (var i = 0; i < this._codebookWeights.length; i += 1) {
                sum += vector1[i1 + i] * vector2[i2 + i];
            }
            return sum;
        },

        magnitude: function (vector, i) {
            return Math.sqrt(this.dot(vector, i, vector, i));
        },

        cosineSimilarity: function (vector1, i1, vector2, i2) {
            return this.dot(vector1, i1, vector2, i2) / (this.magnitude(vector1, i1) * this.magnitude(vector2, i2));
        },

        distance: function (vector1, i1, vector2, i2) {
            return this.euclidianDistance(vector1, i1, vector2, i2);
        },

        euclidianDistance: function (vector1, i1, vector2, i2) {
            var sum = 0;
            for (var i = 0; i < this._codebookWeights.length; i += 1) {
                sum += (Math.pow(vector1[i1 + i] - vector2[i2 + i], 2)) * this._codebookWeights[i];
            }
            return sum;
        },

        learningRate: function (s, iterationLimit) {
            return this._initialLearningRate * (iterationLimit - s) / iterationLimit;
        },

        neighbourhoodDistance: function (s, iterationLimit) {
            return this._mapRadius * (iterationLimit - s) / iterationLimit;
        },

        toIndex: function (x, y) {
            return ((this._worldWidth * y) + x) * this._codebookWeights.length;
        },


        toXY: function (index, out) {
            out.x = (index / this._codebookWeights.length) % this._worldWidth;
            out.y = Math.floor(index / this._codebookWeights.length / this._worldWidth);
        },

        cosineCompare: function (distance1, distance2) {
            return distance2 < distance1;
        },

        euclidianDistanceCompare: function (distance1, distance2) {
            return distance1 < distance2;
        },

        isLeftBetterThanRight: function (distance1, distance2) {
            return this.euclidianDistanceCompare(distance1, distance2);
        },


        jiggerBMU: function (feature, fi, x, y, out) {

            var dx = 0;
            var dy = 0;
            var i;

            var total = 0;
            //up down top left
            if (between(x - 1, 0, this._worldWidth)) {
                i = this.toIndex(x - 1, y);
                dx -= (1 - this.distance(this._neuralWeights, i, feature, fi) / this._codebookWeights.length) / 2;
                total += 1;
            }
            if (between(x + 1, 0, this._worldWidth)) {
                i = this.toIndex(x + 1, y);
                dx += (1 - this.distance(this._neuralWeights, i, feature, fi) / this._codebookWeights.length) / 2;
                total += 1;
            }

            if (between(y - 1, 0, this._worldHeight)) {
                i = this.toIndex(x, y - 1);
                dy -= (1 - this.distance(this._neuralWeights, i, feature, fi) / this._codebookWeights.length) / 2;
                total += 1;
            }

            if (between(y + 1, 0, this._worldHeight)) {
                i = this.toIndex(x, y + 1);
                dy += (1 - this.distance(this._neuralWeights, i, feature, fi) / this._codebookWeights.length) / 2;
                total += 1;
            }


            //diagonal
            var d;
            if (between(x - 1, 0, this._worldWidth) && between(y - 1, 0, this._worldHeight)) {
                i = this.toIndex(x - 1, y - 1);
                d = 1 - (this.distance(this._neuralWeights, i, feature, fi) / this._codebookWeights.length) * 1.4142135623730951;
                dx -= d / 2;
                dy -= d / 2;
                total += 1;
            }
            if (between(x - 1, 0, this._worldWidth) && between(y + 1, 0, this._worldHeight)) {
                i = this.toIndex(x - 1, y + 1);
                d = 1 - (this.distance(this._neuralWeights, i, feature, fi) / this._codebookWeights.length) * 1.4142135623730951;
                dx -= d / 2;
                dy += d / 2;
                total += 1;
            }
            if (between(x + 1, 0, this._worldWidth) && between(y - 1, 0, this._worldHeight)) {
                i = this.toIndex(x + 1, y - 1);
                d = 1 - (this.distance(this._neuralWeights, i, feature, fi) / this._codebookWeights.length) * 1.4142135623730951;
                dx += d / 2;
                dy -= d / 2;
                total += 1;
            }
            if (between(x + 1, 0, this._worldWidth) && between(y + 1, 0, this._worldHeight)) {
                i = this.toIndex(x + 1, y + 1);
                d = 1 - (this.distance(this._neuralWeights, i, feature, fi) / this._codebookWeights.length) * 1.4142135623730951;
                dx += d / 2;
                dy += d / 2;
                total += 1;
            }


            out.jx = x + sign(dx) * ease(Math.abs(dx * 2) / total) / 2;
            out.jy = y + sign(dy) * ease(Math.abs(dy * 2) / total) / 2;


        },

        bmu: function (feature, fi, out) {
            var minDistance = Infinity;
            var minI, dist;
            for (var i = 0; i < this._neuralWeights.length; i += this._codebookWeights.length) {
                dist = this.distance(this._neuralWeights, i, feature, fi, this._codebookWeights.length);
                if (this.isLeftBetterThanRight(dist, minDistance)) {
                    minDistance = dist;
                    minI = i;
                }
            }
            out.i = minI;
            this.toXY(minI, out);
        },

        statistics: function (indices, trainingData) {
            var statistics = {
                count: indices.length,
                mins: new Array(this._codebookWeights.length),
                maxs: new Array(this._codebookWeights.length)
            };
            for (var s = 0; s < this._codebookWeights.length; s += 1) {
                statistics.mins[s] = 1;
                statistics.maxs[s] = 0;
            }

            for (var i = 0; i < indices.length; i += 1) {
                for (var c = 0; c < this._codebookWeights.length; c += 1) {
                    statistics.mins[c] = Math.min(trainingData[this._codebookWeights.length * indices[i] + c], statistics.mins[c]);
                    statistics.maxs[c] = Math.max(trainingData[this._codebookWeights.length * indices[i] + c], statistics.maxs[c]);
                }
            }
            return statistics;
        },

        bmus: function (data) {
            var out = {};
            var results = [];
            for (var i = 0; i < data.length; i += this._codebookWeights.length) {
                this.bmu(data, i, out);
                this.jiggerBMU(data, i, out.x, out.y, out);
                results.push({x: out.jx, y: out.jy, index: i});
            }
            return results;
        }


    });


});