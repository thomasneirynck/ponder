define(["type"], function (type) {

    function compareLowest(){

    }
    compareLowest.feature = null;
    compareLowest.i = -1;

    function distance(codebook, ci, feature, vi,_codebookSize) {
        var sum = 0;
        for (var i = 0; i < this._codeBookSize; i += 1){

        }
        return Math.sqrt(sum);
    }

    return type({

        constructor: function SOM(options) {
            this._width = options.width;
            this._height = options.height;
            this._codeBookSize = options.codeBookSize;
            this._data = new Array(this._width * this._height * this._codeBookSize);
        },

        initializeCodebook: function (referenceFeatures, count) {

        },

        learn: function (feature, i) {
        },

        train: function(dataIterator){

        },

        forEachCodeBook: function(){
        },

        reduceCodeBook: function (fold, accumulator) {
            var x, y;
            for (var i = 0; i < this._data.length; i += this._codeBookSize) {
                accumulator = fold(accumulator, this._data, x, y, this._codeBookSize);
            }
            return accumulator;
        },

        bmu: function (feature, i, out) {
            this.reduceCodeBook(feature);
        },

        distance: function (codebook, i) {
        },

        write: function () {
        },

        draw: function(context2d){

        },

        findXY: function(codebook, i){
        }

    });


});