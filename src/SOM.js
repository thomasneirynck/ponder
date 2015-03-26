define(['Promise',
    "type",
    "./colorRamp"
], function (Promise, type, colorRamp) {

    function between(x, s, e) {
        return x >= s && x < e;
    }

    function sign(n) {
        return n >= 0 ? 1 : -1;
    }

    function ease(t) {
        return t;
//        return 1 + (--t) * t * t * t * t;
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

        draw: function(context2d, data){


            var buffer = document.createElement("canvas").getContext("2d");
            buffer.canvas.width = this._width;
            buffer.canvas.height = this._height;

            var bufferImageData = buffer.getImageData(0, 0, buffer.canvas.width, buffer.canvas.height);

            this.averageD(bufferImageData, function (weight, pixel, pixeli) {
                var color = colorRamp[Math.max(Math.min(colorRamp.length - Math.round(weight * colorRamp.length), colorRamp.length - 1), 0)];
                var rgb = color.split(",");
                pixel[pixeli] = rgb[0];
                pixel[pixeli + 1] = rgb[1];
                pixel[pixeli + 2] = rgb[2];
                pixel[pixeli + 3] = 255;
            });

            buffer.putImageData(bufferImageData, 0, 0);
            context2d.drawImage(buffer.canvas, 0, 0, context2d.canvas.width, context2d.canvas.height);

            var out = {};
            var sx = context2d.canvas.width / this._width;
            var sy = context2d.canvas.height / this._height;

            for (var i = 0; i < data.length; i += this._codeBookSize) {
                this.bmu(data, i, out);
                context2d.fillStyle = "rgb(255,255,255)";
                this.jiggerBMU(data, i, out.x, out.y, out);
                context2d.fillRect(out.jx *sx, out.jy * sy, 2, 2);
            }


        },



        learn: function (sampleData, fi, ni, learningRate, distance, neighbourhoodDistance) {
            var influence = 1 - (distance / neighbourhoodDistance);
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
            var iterationLimit = 32;
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

        drawU: function (context2d, sx, sy) {

            var umatrixcols = [];
            var umatrixrows = [];
            var min = Infinity;
            var max = -Infinity;
            var i, ri, c, r;
            var d;
            for (c = 0; c < this._width - 1; c += 1) {
                for (r = 0; r < this._height; r += 1) {
                    i = this.toIndex(c, r);
                    ri = this.toIndex(c + 1, r);
                    d = this.distance(this._neuralWeights, i, this._neuralWeights, ri);
                    umatrixcols.push(i);
                    umatrixcols.push(d);
                    min = Math.min(min, d);
                    max = Math.max(max, d);
                }
            }

            for (c = 0; c < this._width; c += 1) {
                for (r = 0; r < this._height - 1; r += 1) {
                    i = this.toIndex(c, r);
                    ri = this.toIndex(c, r + 1);
                    d = this.distance(this._neuralWeights, i, this._neuralWeights, ri);
                    umatrixrows.push(i);
                    umatrixrows.push(d);
                    min = Math.min(min, d);
                    max = Math.max(max, d);
                }
            }

            for (i = 0; i < umatrixcols.length; i += 2) {
                umatrixcols[i + 1] = ease((umatrixcols[i + 1] - min) / (max - min));
            }

            for (i = 0; i < umatrixrows.length; i += 2) {
                umatrixrows[i + 1] = ease((umatrixrows[i + 1] - min) / (max - min));
            }

            var xy = {};
            for (i = 0; i < umatrixcols.length; i += 2) {
                this.toXY(umatrixcols[i], xy);
                context2d.beginPath();
                context2d.moveTo((xy.x + 1) * sx, (xy.y ) * sy);
                context2d.lineTo((xy.x + 1) * sx, (xy.y + 1) * sy);
                context2d.strokeStyle = "rgba(0,0,0," + umatrixcols[i + 1] + ")";
//                context2d.strokeStyle = "rgba(0,0,0," + 1 + ")";
                context2d.stroke();
            }

            for (i = 0; i < umatrixrows.length; i += 2) {
                this.toXY(umatrixrows[i], xy);
                context2d.beginPath();
                context2d.moveTo((xy.x ) * sx, (xy.y + 1) * sy);
                context2d.lineTo((xy.x + 1) * sx, (xy.y + 1 ) * sy);
                context2d.strokeStyle = "rgba(0,0,0," + umatrixrows[i + 1] + ")";
                context2d.stroke();
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
//            return ((this._height * x) + y) * this._codeBookSize;
            return ((this._width * y) + x) * this._codeBookSize;
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
                dx -= (1 - this.distance(this._neuralWeights, i, feature, fi) / this._codeBookSize) / 2;
                total += 1;
            }
            if (between(x + 1, 0, this._width)) {
                i = this.toIndex(x + 1, y);
                dx += (1 - this.distance(this._neuralWeights, i, feature, fi) / this._codeBookSize) / 2;
                total += 1;
            }

            if (between(y - 1, 0, this._height)) {
                i = this.toIndex(x, y - 1);
                dy -= (1 - this.distance(this._neuralWeights, i, feature, fi) / this._codeBookSize) / 2;
                total += 1;
            }

            if (between(y + 1, 0, this._height)) {
                i = this.toIndex(x, y + 1);
                dy += (1 - this.distance(this._neuralWeights, i, feature, fi) / this._codeBookSize) / 2;
                total += 1;
            }


            //diagonal
            var d;
            if (between(x - 1, 0, this._width) && between(y - 1, 0, this._height)) {
                i = this.toIndex(x - 1, y - 1);
                d = 1 - (this.distance(this._neuralWeights, i, feature, fi) / this._codeBookSize) * 1.4142135623730951;
                dx -= d / 2;
                dy -= d / 2;
                total += 1;
            }
            if (between(x - 1, 0, this._width) && between(y + 1, 0, this._height)) {
                i = this.toIndex(x - 1, y + 1);
                d = 1 - (this.distance(this._neuralWeights, i, feature, fi) / this._codeBookSize) * 1.4142135623730951;
                dx -= d / 2;
                dy += d / 2;
                total += 1;
            }
            if (between(x + 1, 0, this._width) && between(y - 1, 0, this._height)) {
                i = this.toIndex(x + 1, y - 1);
                d = 1 - (this.distance(this._neuralWeights, i, feature, fi) / this._codeBookSize) * 1.4142135623730951;
                dx += d / 2;
                dy -= d / 2;
                total += 1;
            }
            if (between(x + 1, 0, this._width) && between(y + 1, 0, this._height)) {
                i = this.toIndex(x + 1, y + 1);
                d = 1 - (this.distance(this._neuralWeights, i, feature, fi) / this._codeBookSize) * 1.4142135623730951;
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

        averageD: function (imgData, mapWeigthToPixel) {
            var xy = {};
            var distance , total, x, y, ni;
            var min = Infinity;
            var max = -Infinity;
            var outArray = [];
            for (var i = 0; i < this._neuralWeights.length; i += this._codeBookSize) {

                distance = 0;
                total = 0;
                this.toXY(i, xy);
                x = xy.x;
                y = xy.y;

                if (between(x - 1, 0, this._width)) {
                    ni = this.toIndex(x - 1, y);
                    distance += (this.distance(this._neuralWeights, i, this._neuralWeights, ni) / this._codeBookSize);
                    total += 1;
                }
                if (between(x + 1, 0, this._width)) {
                    ni = this.toIndex(x + 1, y);
                    distance += (this.distance(this._neuralWeights, i, this._neuralWeights, ni) / this._codeBookSize);
                    total += 1;
                }

                if (between(y - 1, 0, this._height)) {
                    ni = this.toIndex(x, y - 1);
                    distance += (this.distance(this._neuralWeights, i, this._neuralWeights, ni) / this._codeBookSize);
                    total += 1;
                }

                if (between(y + 1, 0, this._height)) {
                    ni = this.toIndex(x, y + 1);
                    distance += (this.distance(this._neuralWeights, i, this._neuralWeights, ni) / this._codeBookSize);
                    total += 1;
                }


                outArray[i/this._codeBookSize] = distance / total;
                min = Math.min(min, outArray[i/this._codeBookSize]);
                max = Math.max(max, outArray[i/this._codeBookSize]);
            }

            for (var i = 0, pixeli = 0; i < this._neuralWeights.length / this._codeBookSize; i += 1, pixeli += 4) {
                mapWeigthToPixel(ease(outArray[i] - min) / (max - min), imgData.data, pixeli);
            }

        }

    });


});