define(["type"], function (type) {


    return type({

        constructor: function DataTable(data, columns, selectedColumns) {
            this._data = data;
            this._columns = columns;
            this._selectedColumns = selectedColumns;
            var self = this;
            this._selectedColumnsIndices = this._selectedColumns.map(function (column) {
                return self._columns.indexOf(column);
            });
        },

        createDataArray: function () {

            var mins = new Array(this._selectedColumnsIndices.length);
            var maxs = new Array(this._selectedColumnsIndices.length);
            var i, r, c;
            for (i = 0; i < this._selectedColumnsIndices.length; i += 1) {
                mins[i] = Infinity;
                maxs[i] = -Infinity;
            }
            for (r = 0; r < this._data.length; r += 1) {
                for (c = 0; c < this._selectedColumnsIndices.length; c += 1) {
                    mins[c] = Math.min(mins[c], this._data[r][this._selectedColumnsIndices[c]]);
                    maxs[c] = Math.max(maxs[c], this._data[r][this._selectedColumnsIndices[c]]);
                }
            }

            var dataArray = new Array(this._data.length * this._selectedColumnsIndices.length);
            for (i = 0, r = 0; r < this._data.length; r += 1) {
                for (c = 0; c < this._selectedColumnsIndices.length; c += 1, i += 1) {
                    dataArray[i] = (this._data[r][this._selectedColumnsIndices[c]] - mins[c]) / (maxs[c] - mins[c]);
                }
            }

            return dataArray;

        }

    });


});