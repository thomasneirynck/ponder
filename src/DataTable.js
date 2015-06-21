define(["type"], function (type) {


    return type({

        constructor: function DataTable(data, columns, selectedColumns) {
            this._data = data;
            this._columns = columns;
            this._selectedColumns = selectedColumns;
            this._selectedColumnsIndices = this._selectedColumns.map(function (column) {
                return columns.indexOf(column);
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
                    if (isNaN(parseFloat(this._data[r][this._selectedColumnsIndices[c]]))) {
                        console.warn("ignoring missing value" + " row: " + r + ", col: " + c);
                        continue;
                    }
                    mins[c] = Math.min(mins[c], parseFloat(this._data[r][this._selectedColumnsIndices[c]]));
                    maxs[c] = Math.max(maxs[c], parseFloat(this._data[r][this._selectedColumnsIndices[c]]));
                }
            }

            var dataArray = new Array(this._data.length * this._selectedColumnsIndices.length);
            var value;
            for (i = 0, r = 0; r < this._data.length; r += 1) {
                for (c = 0; c < this._selectedColumnsIndices.length; c += 1, i += 1) {
                    value = parseFloat(this._data[r][this._selectedColumnsIndices[c]]);
                    if (isNaN(value)) {
                        console.warn("Missing value for: " + " row: " + r + ", col: " + c);
                        value = (maxs[c] + mins[c]) / 2;
                    }
                    dataArray[i] = (value - mins[c]) / (maxs[c] - mins[c]);
                }
            }

            return dataArray;

        },

        getSelectedColumnIndexByDataArrayIndex: function (index) {
            return this._selectedColumnsIndices[index];
        },

        getValueByRowAndColumnIndex: function (index, columnIndex) {
            return this._data[index][columnIndex];
        }

    });


});