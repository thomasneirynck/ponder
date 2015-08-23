define(["type", "./blueToWhite"], function (type, blueToWhite2) {


    return type({

        constructor: function ColorMapper() {
            this._a = 0.5;
            this._b = 0.5;
        },

        _map: function (value) {
            var y = Math.log(this._a) / Math.log(this._b);
            return Math.pow(value, 1 / y);
        },

        setEasingParameters: function (a, b) {
            this._a = a;
            this._b = b;
        },

        /**
         * @param values array with values, layed row by row
         * @param imageData 2d pixel buffer from html-canvas. length should be 4 times the length of the featurebuffer
         */
        fillPixelBuffer: function (values, imageData) {
            var weight, rgb;
            for (var i = 0, pixeli = 0; i < values.length; i += 1, pixeli += 4) {
                weight = this._map(values[i]);
                rgb = blueToWhite2[Math.max(Math.min(blueToWhite2.length - Math.round(weight * blueToWhite2.length), blueToWhite2.length - 1), 0)];
                imageData.data[pixeli] = rgb[0];
                imageData.data[pixeli + 1] = rgb[1];
                imageData.data[pixeli + 2] = rgb[2];
                imageData.data[pixeli + 3] = 255;
            }
        }
    });

});