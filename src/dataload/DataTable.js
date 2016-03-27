define(["type", "../util"], function (type, util) {


    function getColumnsIndex(columns, column) {
        return columns.indexOf(column);
    }

    return type({

        constructor: function DataTable(data, columns, selectedOrdinalColumns, selectedCategoryColumns) {
            this._data = data;
            this._columnNames = columns;
            this._selectedOrdinalColumns = selectedOrdinalColumns;
            this._selectedOrdinalColumnsIndices = this._selectedOrdinalColumns.map(getColumnsIndex.bind(null, columns));


            this._selectedCategoryColumns = selectedCategoryColumns;
            this._selectedCategoryColumnIndices = this._selectedCategoryColumns.map(getColumnsIndex.bind(null, columns));

            //caches
            this._uniques = {};
            this._minMax = {};
            this._counts = {};

        },

        getSelectedOrdinalColumns: function () {
            return this._selectedOrdinalColumns;
        },

        getSelectedCategoryColumns: function () {
            return this._selectedCategoryColumns;
        },

        getValueByRowAndColumnName: function (row, columnName) {
            return this.getValueByRowAndColumnIndex(row, this.getColumnIndex(columnName));
        },

        getColumnName: function(index){
          return this._columnNames[index];
        },

        getColumns: function () {
            return this._columnNames;
        },

        getMinMax: function (columnIndexForOdinal) {

            if (this._minMax[columnIndexForOdinal]) {
                return this._minMax[columnIndexForOdinal];
            }


            var min = Infinity;
            var max = -Infinity;
            for (var i = 0; i < this._data.length; i += 1) {
                if (isNaN(util.toNumber(this._data[i][columnIndexForOdinal]))) {
                    continue;
                }
                min = Math.min(min, util.toNumber(this._data[i][columnIndexForOdinal]));
                max = Math.max(max, util.toNumber(this._data[i][columnIndexForOdinal]));
            }

            this._minMax[columnIndexForOdinal] = [min, max];
            return this._minMax[columnIndexForOdinal];

        },

        filterItems: function (columnIndex, value) {
            var results = [];
            for (var i = 0; i < this._data.length; i += 1) {
                if (this._data[i][columnIndex] === value) {
                    results.push(i);
                }
            }
            return results;

        },

        getCounts: function (columnIndexForCategory) {

            if (this._counts[columnIndexForCategory]) {
                return this._counts[columnIndexForCategory];
            }

            var uniques = this.getUniqueValues(columnIndexForCategory);

            this._counts[columnIndexForCategory] = {};
            for (var u = 0; u < uniques.length; u += 1) {
                this._counts[columnIndexForCategory][uniques[u]] = 0;
            }

            for (var i = 0; i < this._data.length; i += 1) {
                this._counts[columnIndexForCategory][this._data[i][columnIndexForCategory]] += 1;
            }
            return this._counts[columnIndexForCategory];


        },

        isOrdinal: function (columnIndex) {
            return this._selectedOrdinalColumnsIndices.indexOf(parseInt(columnIndex)) > -1;
        },

        isExcluded: function (columnIndex) {
            return !this.isOrdinal(parseInt(columnIndex)) && !this.isCategory(parseInt(columnIndex));
        },

        isCategory: function (columnIndex) {
            return this._selectedCategoryColumnIndices.indexOf(parseInt(columnIndex)) > -1;
        },

        getUniqueValues: function (columnIndex) {
            if (this._uniques[columnIndex]) {
                return this._uniques[columnIndex];
            }
            this._uniques[columnIndex] = [];
            for (var i = 0; i < this._data.length; i += 1) {
                if (this._uniques[columnIndex].indexOf(this._data[i][columnIndex]) < 0) {
                    this._uniques[columnIndex].push(this._data[i][columnIndex]);
                    if (this._uniques[columnIndex].length > 256){
                        break;
                    }
                }
            }
            return this._uniques[columnIndex];
        },

        createSOMTrainingData: function () {



            //ORDINAL PREP
            var mins = new Array(this._selectedOrdinalColumnsIndices.length);
            var maxs = new Array(this._selectedOrdinalColumnsIndices.length);
            var i, r, c;
            for (i = 0; i < this._selectedOrdinalColumnsIndices.length; i += 1) {
                mins[i] = Infinity;
                maxs[i] = -Infinity;
            }
            for (r = 0; r < this._data.length; r += 1) {
                for (c = 0; c < this._selectedOrdinalColumnsIndices.length; c += 1) {
                    if (isNaN(util.toNumber(this._data[r][this._selectedOrdinalColumnsIndices[c]]))) {
                        console.warn("ignoring missing value" + " row: " + r + ", col: " + c);
                        continue;
                    }
                    mins[c] = Math.min(mins[c], util.toNumber(this._data[r][this._selectedOrdinalColumnsIndices[c]]));
                    maxs[c] = Math.max(maxs[c], util.toNumber(this._data[r][this._selectedOrdinalColumnsIndices[c]]));
                }
            }

            //CATEGORY PREP
            var categories = new Array(this._selectedCategoryColumnIndices.length);
            var totCategories = 0;
            for (i = 0; i < this._selectedCategoryColumnIndices.length; i += 1) {
                categories[i] = {
                    indexInRow: this._selectedCategoryColumnIndices[i],
                    uniqueValues: this.getUniqueValues(this._selectedCategoryColumnIndices[i])
                };
                totCategories += categories[i].uniqueValues.length;
            }

            //WEIGHTS
            var codebookWeights = [];
            for (i = 0; i < this._selectedOrdinalColumnsIndices.length; i += 1) {
                codebookWeights.push(1);
            }
            for (c = 0; c < categories.length; c += 1) {
                for (i = 0; i < categories[c].uniqueValues.length; i += 1) {
                    codebookWeights.push(1 / categories[c].uniqueValues.length);
                }
            }

            //FILL THE DATA
            var dataArray = new Array(this._data.length * (this._selectedOrdinalColumnsIndices.length + totCategories));

            var value, v;
            for (i = 0, r = 0; r < this._data.length; r += 1) {

                //ordinals
                for (c = 0; c < this._selectedOrdinalColumnsIndices.length; c += 1, i += 1) {
                    value = util.toNumber(this._data[r][this._selectedOrdinalColumnsIndices[c]]);
                    if (isNaN(value)) {
                        console.warn("Missing value for: " + " row: " + r + ", col: " + c);
                        value = (maxs[c] + mins[c]) / 2;
                    }
                    dataArray[i] = (value - mins[c]) / (maxs[c] - mins[c]);
                }

                //categories
                for (c = 0; c < categories.length; c += 1) {
                    for (v = 0; v < categories[c].uniqueValues.length; v += 1) {
                        dataArray[i] = (categories[c].uniqueValues[v] === this._data[r][categories[c].indexInRow]) ? 1 : 0;
                        i += 1;
                    }
                }
            }


            return {
                dataArray: dataArray,
                codebookWeights: codebookWeights
            };

        },

        getColumnIndex: function (columnName) {
            return this._columnNames.indexOf(columnName);
        },

        getValueByRowAndColumnIndex: function (index, columnIndex) {
            return this._data[index][columnIndex];
        },

        getFeatureData: function (index) {
            return this._data[index];
        }

    });


});