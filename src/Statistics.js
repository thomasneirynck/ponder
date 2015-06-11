define(["type"], function (type) {

    return type({

        constructor: function Statistics(statsData, originalData, indices) {
            this._stats = statsData;
            this._dataArray = originalData;
            this._indices = indices;
        }

    });

});