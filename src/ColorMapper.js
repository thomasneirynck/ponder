define(["type", "./blueToWhite"], function (type,blueToWhite) {


    return type({

        constructor: function () {
            this._a = 0.5;
            this._b = 0.5;
        },

        setContrastParams: function (a, b) {
            this._a = a;
            this._b = b;
        },

        _map: function (value) {
            var y = Math.log(this._a) / Math.log(this._b);
            return Math.pow(value, 1 / y);
        },

        fillPixelBuffer: function (featureBuffer, imageData) {
            var weight, rgb;
            for (var i = 0, pixeli = 0; i < featureBuffer.length; i += 1, pixeli += 4) {
                weight = this._map(featureBuffer[i]);
                rgb = blueToWhite[Math.max(Math.min(blueToWhite.length - Math.round(weight * blueToWhite.length), blueToWhite.length - 1), 0)];
                imageData.data[pixeli] = rgb[0];
                imageData.data[pixeli + 1] = rgb[1];
                imageData.data[pixeli + 2] = rgb[2];
                imageData.data[pixeli + 3] = 255;
            }
        }
    });

});