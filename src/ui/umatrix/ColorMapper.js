define(["type", "./whiteToBrown"], function (type, colorRamp) {


    return type({

        constructor: function ColorMapper() {
            this._map = function(x){return x;};
        },

        setEasingFunction: function (easingFunction) {
            this._map = easingFunction;
        },

        /**
         * @param values array with values, layed row by row
         * @param imageData 2d pixel buffer from html-canvas. length should be 4 times the length of the featurebuffer
         */
        fillPixelBuffer: function (values, imageData) {
            var weight, rgb;
            for (var i = 0, pixeli = 0; i < values.length; i += 1, pixeli += 4) {
                weight = this._map(values[i]);
                rgb = colorRamp[Math.max(Math.min(colorRamp.length - Math.round(weight * colorRamp.length), colorRamp.length - 1), 0)];
                imageData.data[pixeli] = rgb[0];
                imageData.data[pixeli + 1] = rgb[1];
                imageData.data[pixeli + 2] = rgb[2];
                imageData.data[pixeli + 3] = 255;
            }
        }
    });

});