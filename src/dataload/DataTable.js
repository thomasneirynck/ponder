define(["type","./util"], function (type, util) {



    return type({

        constructor: function DataTable(data, columns, selectedColumns) {
            this._data = data;
            this._columns = columns;
            this._selectedOrdinalColumns = selectedColumns;
            this._selectedColumnsIndices = this._selectedOrdinalColumns.map(function (column) {
                return columns.indexOf(column);
            });
            this._uniques = [];
        },

        getSelectedColumns: function () {
            return this._selectedOrdinalColumns;
        },

        getColumns: function () {
            return this._columns;
        },

        getMinMax: function (columnIndex) {

            var min = Infinity;
            var max = -Infinity;
            for (var i = 0; i < this._data.length; i += 1) {
                if (isNaN(util.toNumber(this._data[i][columnIndex]))) {
                    continue;
                }
                min = Math.min(min, util.toNumber(this._data[i][columnIndex]));
                max = Math.max(max, util.toNumber(this._data[i][columnIndex]));
            }
            return [min, max];

        },

        getUniqueValues: function (columnIndex) {
            if (this._uniques[columnIndex]) {
                return this._uniques[columnIndex];
            }
            this._uniques[columnIndex] = [];
            for (var i = 0; i < this._data.length; i += 1) {
                if (this._uniques[columnIndex].indexOf(this._data[i][columnIndex]) < 0) {
                    this._uniques[columnIndex].push(this._data[i][columnIndex]);
                }
            }
            return this._uniques[columnIndex];
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
                    if (isNaN(util.toNumber(this._data[r][this._selectedColumnsIndices[c]]))) {
                        console.warn("ignoring missing value" + " row: " + r + ", col: " + c);
                        continue;
                    }
                    mins[c] = Math.min(mins[c], util.toNumber(this._data[r][this._selectedColumnsIndices[c]]));
                    maxs[c] = Math.max(maxs[c], util.toNumber(this._data[r][this._selectedColumnsIndices[c]]));
                }
            }

            var dataArray = new Array(this._data.length * this._selectedColumnsIndices.length);
            var value;
            for (i = 0, r = 0; r < this._data.length; r += 1) {
                for (c = 0; c < this._selectedColumnsIndices.length; c += 1, i += 1) {
                    value = util.toNumber(this._data[r][this._selectedColumnsIndices[c]]);
                    if (isNaN(value)) {
                        console.warn("Missing value for: " + " row: " + r + ", col: " + c);
                        value = (maxs[c] + mins[c]) / 2;
                    }
                    dataArray[i] = (value - mins[c]) / (maxs[c] - mins[c]);
                }
            }

            return dataArray;

        },

        getColumnIndex: function (column) {
            return this._columns.indexOf(column);
        },

        getSelectedColumnIndexByDataArrayIndex: function (index) {
            return this._selectedColumnsIndices[index];
        },

        getValueByRowAndColumnIndex: function (index, columnIndex) {
            return this._data[index][columnIndex];
        },

        getFeatureData: function (index) {
            return this._data[index];
        }

    });


});