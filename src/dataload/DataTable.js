define(["type", "../util", "../Table"], function (type, util, Table) {


    return type(Table.prototype, {


        constructor: function DataTableComposed(table) {
            this._table = table;

            //caches
            this._uniques = {};
            this._minMax = {};
            this._counts = {};
        },


        getName: function () {
            return this._table.getName();
        },

        columnCount: function () {
            return this._table.columnCount();
        },

        columnLabel: function (columnIndex) {
            return this._table.columnLabel(columnIndex);
        },

        columnType: function (columIndex) {
            return this._table.columnType(columIndex);
        },

        rowCount: function () {
            return this._table.rowCount();
        },

        getValue: function (rowNumber, columnNumber) {
            return this._table.getValue(rowNumber, columnNumber);
        },

        /////////////////////////////////////////////////////////////////////////////////////////////
        getColumnsByType: function (columnType) {
            var columns = [];
            for (var i = 0; i < this._table.columnCount(); i += 1) {
                if (this._table.columnType(i) === columnType) {
                    columns.push(i);
                }
            }
            return columns;
        },


        getColumnLabels: function () {
            var columns = [];
            for (var i = 0; i < this._table.columnCount(); i += 1) {
                columns.push(this._table.columnLabel(i));
            }
            return columns;
        },

        getMinMax: function (columnIndexForOdinal) {

            columnIndexForOdinal = parseInt(columnIndexForOdinal);
            if (this._minMax[columnIndexForOdinal]) {
                return this._minMax[columnIndexForOdinal];
            }


            var min = Infinity;
            var max = -Infinity;
            var value;
            for (var i = 0; i < this._table.rowCount(); i += 1) {
                value = util.toNumber(this._table.getValue(i, columnIndexForOdinal));
                if (isNaN(value)) {
                    continue;
                }
                min = Math.min(min, value);
                max = Math.max(max, value);
            }

            this._minMax[columnIndexForOdinal] = [min, max];

            return this._minMax[columnIndexForOdinal];

        },

        filterItems: function (columnIndex, value) {
            var results = [];
            for (var i = 0; i < this._table.rowCount(); i += 1) {
                if (this._table.getValue(i, columnIndex) === value) {
                    results.push(i);
                }
            }
            return results;
        },

        getUniqueValues: function (columnIndex) {

            if (this._uniques[columnIndex]) {
                return this._uniques[columnIndex];
            }

            this._uniques[columnIndex] = [];
            for (var i = 0; i < this._table.rowCount(); i += 1) {
                if (this._uniques[columnIndex].indexOf(this.getValue(i, columnIndex)) < 0) {
                    this._uniques[columnIndex].push(this.getValue(i, columnIndex));
                    if (this._uniques[columnIndex].length > 256) {
                        break;
                    }
                }
            }
            return this._uniques[columnIndex];
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

            for (var i = 0; i < this._table.rowCount(); i += 1) {
                this._counts[columnIndexForCategory][this._table.getValue(i, columnIndexForCategory)] += 1;
            }

            return this._counts[columnIndexForCategory];

        },

        isType: function(columnIndex, columnType){
            return this._table.columnType(parseInt(columnIndex)) === columnType;
        },

        getFeatureData: function (index) {
            var featureData = [];
            for (var i = 0; i < this._table.columnCount(); i += 1) {
                featureData.push(this._table.getValue(index, i));
            }
            return featureData;
        },

        createSOMTrainingData: function () {

            var selectedOrdinalColumnsIndices = [];
            var selectedCategoryColumnIndices = [];
            var i;
            for (i = 0; i < this._table.columnCount(); i += 1) {
                if (this._table.columnType(i) === Table.ORDINAL) {
                    selectedOrdinalColumnsIndices.push(i);
                } else if (this._table.columnType(i) === Table.CATEGORY) {
                    selectedCategoryColumnIndices.push(i);
                }
            }

            //ORDINAL PREP
            var mins = [];
            var maxs = [];

            var r, c;
            for (i = 0; i < selectedOrdinalColumnsIndices.length; i += 1) {
                mins[i] = Infinity;
                maxs[i] = -Infinity;
            }


            var value;
            for (r = 0; r < this._table.rowCount(); r += 1) {
                for (c = 0; c < selectedOrdinalColumnsIndices.length; c += 1) {
                    value = util.toNumber(this._table.getValue(r, selectedOrdinalColumnsIndices[c]));
                    if (isNaN(value)) {
                        console.warn("ignoring missing value" + " row: " + r + ", col: " + c);
                        continue;
                    }
                    mins[c] = Math.min(mins[c], value);
                    maxs[c] = Math.max(maxs[c], value);
                }
            }

            //CATEGORY PREP
            var categories = new Array(selectedCategoryColumnIndices.length);
            var totCategories = 0;
            for (i = 0; i < selectedCategoryColumnIndices.length; i += 1) {
                categories[i] = {
                    indexInRow: selectedCategoryColumnIndices[i],
                    uniqueValues: this.getUniqueValues(selectedCategoryColumnIndices[i])
                };
                totCategories += categories[i].uniqueValues.length;
            }

            //WEIGHTS
            var codebookWeights = [];
            for (i = 0; i < selectedOrdinalColumnsIndices.length; i += 1) {
                codebookWeights.push(1);
            }
            for (c = 0; c < categories.length; c += 1) {
                for (i = 0; i < categories[c].uniqueValues.length; i += 1) {
                    codebookWeights.push(1 / categories[c].uniqueValues.length);
                }
            }

            //FILL THE DATA
            var dataArray = new Array(this._table.rowCount() * (selectedOrdinalColumnsIndices.length + totCategories));

            var v;
            for (i = 0, r = 0; r < this._table.rowCount(); r += 1) {

                //scale ordinals to [0,1] domain
                for (c = 0; c < selectedOrdinalColumnsIndices.length; c += 1, i += 1) {
                    value = util.toNumber(this._table.getValue(r, selectedOrdinalColumnsIndices[c]));
                    if (isNaN(value)) {
                        console.warn("Missing value for: " + " row: " + r + ", col: " + c);
                        value = (maxs[c] + mins[c]) / 2;
                    }
                    dataArray[i] = (value - mins[c]) / (maxs[c] - mins[c]);
                }

                //categories
                for (c = 0; c < categories.length; c += 1) {
                    for (v = 0; v < categories[c].uniqueValues.length; v += 1) {
                        dataArray[i] = (categories[c].uniqueValues[v] === this._table.getValue(r, categories[c].indexInRow)) ? 1 : 0;
                        i += 1;
                    }
                }
            }


            return {
                dataArray: dataArray,
                codebookWeights: codebookWeights
            };

        }

    });


});