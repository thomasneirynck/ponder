define(["type", "../util", "../Table"], function (type, util, Table) {

    function getColumnsIndex(columns, column) {
        return columns.indexOf(column);
    }


    var DataTableComposed = type(Table.prototype, {


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

        getSelectedOrdinalColumns: function () {
            var columns = [];
            for (var i = 0; i < this._table.columnCount(); i += 1) {
                if (this._table.columnType(i) === Table.ORDINAL) {
                    columns.push(this._table.columnLabel(i));
                }
            }
            return columns;
        },

        getSelectedCategoryColumns: function () {
            var columns = [];
            for (var i = 0; i < this._table.columnCount(); i += 1) {
                if (this._table.columnType(i) === Table.CATEGORY) {
                    columns.push(this._table.columnLabel(i));
                }
            }
            return columns;
        },

        getColumnIndex: function (columnName) {
            for (var i = 0; i < this._table.columnCount(); i += 1) {
                if (this._table.columnLabel(i) === columnName) {
                    return i;
                }
            }
            throw new Error('no column index for this name');
        },


        getValueByRowAndColumnName: function (row, columnName) {
            return this.getValueByRowAndColumnIndex(row, this.getColumnIndex(columnName));
        },

        getValueByRowAndColumnIndex: function (index, columnIndex) {
            return this._table.getValue(index, columnIndex);
        },

        getColumnName: function (index) {
            return this._table.columnLabel(index);
        },

        getColumns: function () {
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
                value = util.toNumber(this._table.getValue([i], columnIndexForOdinal));
                if (isNaN(value)) {
                    continue;
                }
                min = Math.min(min, value);
                max = Math.max(max, value);
            }

            this._minMax[columnIndexForOdinal] = [min, max];

            console.log('minmax', this._minMax);
            return this._minMax[columnIndexForOdinal];

        },

        filterItems: function (columnIndex, value) {
            var results = [];
            for (var i = 0; i < this._table.rowCount(); i += 1) {
                if (this._table.getValue([i][columnIndex]) === value) {
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
                if (this._uniques[columnIndex].indexOf(this.getValue([i][columnIndex])) < 0) {
                    this._uniques[columnIndex].push(this.getValue([i][columnIndex]));
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

            for (var i = 0; i < this._data.length; i += 1) {
                this._counts[columnIndexForCategory][this.getValue([i][columnIndexForCategory])] += 1;
            }
            return this._counts[columnIndexForCategory];

        },

        isOrdinal: function (columnIndex) {
            return this._table.columnType(parseInt(columnIndex)) === Table.ORDINAL;
        },

        isExcluded: function (columnIndex) {
            return this._table.columnType(parseInt(columnIndex)) === Table.IGNORE;
        },

        isCategory: function (columnIndex) {
            return this._table.columnType(parseInt(columnIndex)) === Table.CATEGORY;
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
                    value = util.toNumber(this._table.getValue([r], selectedOrdinalColumnsIndices[c]));
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
                    value = util.toNumber(this._table.getValue([r], [selectedOrdinalColumnsIndices[c]]));
                    if (isNaN(value)) {
                        console.warn("Missing value for: " + " row: " + r + ", col: " + c);
                        value = (maxs[c] + mins[c]) / 2;
                    }
                    dataArray[i] = (value - mins[c]) / (maxs[c] - mins[c]);
                }

                //categories
                for (c = 0; c < categories.length; c += 1) {
                    for (v = 0; v < categories[c].uniqueValues.length; v += 1) {
                        dataArray[i] = (categories[c].uniqueValues[v] === this._table.getValue([r], [categories[c].indexInRow])) ? 1 : 0;
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


    DataTableComposed.createDataTableFromTable = function (table) {
        return new DataTableComposed(table);
    };

    return DataTableComposed;


    // //todo: we introduced public data api (ponder/Table). The SOM components should use that API, instead use datatable...
    // // REMOVE THIS SHIAT!
    // var DataTable = type({
    //
    //     constructor: function DataTable(name, data, columns, selectedOrdinalColumns, selectedCategoryColumns) {
    //         this._name = name;
    //         this._data = data;
    //         this._columnNames = columns;
    //         this._selectedOrdinalColumns = selectedOrdinalColumns;
    //         this._selectedOrdinalColumnsIndices = this._selectedOrdinalColumns.map(getColumnsIndex.bind(null, columns));
    //
    //
    //         this._selectedCategoryColumns = selectedCategoryColumns;
    //         this._selectedCategoryColumnIndices = this._selectedCategoryColumns.map(getColumnsIndex.bind(null, columns));
    //
    //         //caches
    //         this._uniques = {};
    //         this._minMax = {};
    //         this._counts = {};
    //
    //     },
    //
    //     getName: function () {
    //         return this._name;
    //     },
    //
    //     getSelectedOrdinalColumns: function () {
    //         return this._selectedOrdinalColumns;
    //     },
    //
    //     getSelectedCategoryColumns: function () {
    //         return this._selectedCategoryColumns;
    //     },
    //
    //     getValueByRowAndColumnName: function (row, columnName) {
    //         return this.getValueByRowAndColumnIndex(row, this.getColumnIndex(columnName));
    //     },
    //
    //     getColumnName: function (index) {
    //         return this._columnNames[index];
    //     },
    //
    //     getColumns: function () {
    //         return this._columnNames;
    //     },
    //
    //     getMinMax: function (columnIndexForOdinal) {
    //
    //         if (this._minMax[columnIndexForOdinal]) {
    //             return this._minMax[columnIndexForOdinal];
    //         }
    //
    //
    //         var min = Infinity;
    //         var max = -Infinity;
    //         for (var i = 0; i < this._data.length; i += 1) {
    //             if (isNaN(util.toNumber(this._data[i][columnIndexForOdinal]))) {
    //                 continue;
    //             }
    //             min = Math.min(min, util.toNumber(this._data[i][columnIndexForOdinal]));
    //             max = Math.max(max, util.toNumber(this._data[i][columnIndexForOdinal]));
    //         }
    //
    //         this._minMax[columnIndexForOdinal] = [min, max];
    //         return this._minMax[columnIndexForOdinal];
    //
    //     },
    //
    //     filterItems: function (columnIndex, value) {
    //         var results = [];
    //         for (var i = 0; i < this._data.length; i += 1) {
    //             if (this._data[i][columnIndex] === value) {
    //                 results.push(i);
    //             }
    //         }
    //         return results;
    //
    //     },
    //
    //     getCounts: function (columnIndexForCategory) {
    //
    //         if (this._counts[columnIndexForCategory]) {
    //             return this._counts[columnIndexForCategory];
    //         }
    //
    //         var uniques = this.getUniqueValues(columnIndexForCategory);
    //
    //         this._counts[columnIndexForCategory] = {};
    //         for (var u = 0; u < uniques.length; u += 1) {
    //             this._counts[columnIndexForCategory][uniques[u]] = 0;
    //         }
    //
    //         for (var i = 0; i < this._data.length; i += 1) {
    //             this._counts[columnIndexForCategory][this._data[i][columnIndexForCategory]] += 1;
    //         }
    //         return this._counts[columnIndexForCategory];
    //
    //
    //     },
    //
    //     isOrdinal: function (columnIndex) {
    //         return this._selectedOrdinalColumnsIndices.indexOf(parseInt(columnIndex)) > -1;
    //     },
    //
    //     isExcluded: function (columnIndex) {
    //         return !this.isOrdinal(parseInt(columnIndex)) && !this.isCategory(parseInt(columnIndex));
    //     },
    //
    //     isCategory: function (columnIndex) {
    //         return this._selectedCategoryColumnIndices.indexOf(parseInt(columnIndex)) > -1;
    //     },
    //
    //     getUniqueValues: function (columnIndex) {
    //         if (this._uniques[columnIndex]) {
    //             return this._uniques[columnIndex];
    //         }
    //         this._uniques[columnIndex] = [];
    //         for (var i = 0; i < this._data.length; i += 1) {
    //             if (this._uniques[columnIndex].indexOf(this._data[i][columnIndex]) < 0) {
    //                 this._uniques[columnIndex].push(this._data[i][columnIndex]);
    //                 if (this._uniques[columnIndex].length > 256) {
    //                     break;
    //                 }
    //             }
    //         }
    //         return this._uniques[columnIndex];
    //     },
    //
    //     createSOMTrainingData: function () {
    //
    //         //ORDINAL PREP
    //         var mins = new Array(this._selectedOrdinalColumnsIndices.length);
    //         var maxs = new Array(this._selectedOrdinalColumnsIndices.length);
    //         var i, r, c;
    //         for (i = 0; i < this._selectedOrdinalColumnsIndices.length; i += 1) {
    //             mins[i] = Infinity;
    //             maxs[i] = -Infinity;
    //         }
    //         for (r = 0; r < this._data.length; r += 1) {
    //             for (c = 0; c < this._selectedOrdinalColumnsIndices.length; c += 1) {
    //                 if (isNaN(util.toNumber(this._data[r][this._selectedOrdinalColumnsIndices[c]]))) {
    //                     console.warn("ignoring missing value" + " row: " + r + ", col: " + c);
    //                     continue;
    //                 }
    //                 mins[c] = Math.min(mins[c], util.toNumber(this._data[r][this._selectedOrdinalColumnsIndices[c]]));
    //                 maxs[c] = Math.max(maxs[c], util.toNumber(this._data[r][this._selectedOrdinalColumnsIndices[c]]));
    //             }
    //         }
    //
    //         //CATEGORY PREP
    //         var categories = new Array(this._selectedCategoryColumnIndices.length);
    //         var totCategories = 0;
    //         for (i = 0; i < this._selectedCategoryColumnIndices.length; i += 1) {
    //             categories[i] = {
    //                 indexInRow: this._selectedCategoryColumnIndices[i],
    //                 uniqueValues: this.getUniqueValues(this._selectedCategoryColumnIndices[i])
    //             };
    //             totCategories += categories[i].uniqueValues.length;
    //         }
    //
    //         //WEIGHTS
    //         var codebookWeights = [];
    //         for (i = 0; i < this._selectedOrdinalColumnsIndices.length; i += 1) {
    //             codebookWeights.push(1);
    //         }
    //         for (c = 0; c < categories.length; c += 1) {
    //             for (i = 0; i < categories[c].uniqueValues.length; i += 1) {
    //                 codebookWeights.push(1 / categories[c].uniqueValues.length);
    //             }
    //         }
    //
    //         //FILL THE DATA
    //         var dataArray = new Array(this._data.length * (this._selectedOrdinalColumnsIndices.length + totCategories));
    //
    //         var value, v;
    //         for (i = 0, r = 0; r < this._data.length; r += 1) {
    //
    //             //ordinals
    //             for (c = 0; c < this._selectedOrdinalColumnsIndices.length; c += 1, i += 1) {
    //                 value = util.toNumber(this._data[r][this._selectedOrdinalColumnsIndices[c]]);
    //                 if (isNaN(value)) {
    //                     console.warn("Missing value for: " + " row: " + r + ", col: " + c);
    //                     value = (maxs[c] + mins[c]) / 2;
    //                 }
    //                 dataArray[i] = (value - mins[c]) / (maxs[c] - mins[c]);
    //             }
    //
    //             //categories
    //             for (c = 0; c < categories.length; c += 1) {
    //                 for (v = 0; v < categories[c].uniqueValues.length; v += 1) {
    //                     dataArray[i] = (categories[c].uniqueValues[v] === this._data[r][categories[c].indexInRow]) ? 1 : 0;
    //                     i += 1;
    //                 }
    //             }
    //         }
    //
    //
    //         return {
    //             dataArray: dataArray,
    //             codebookWeights: codebookWeights
    //         };
    //
    //     },
    //
    //     getColumnIndex: function (columnName) {
    //         return this._columnNames.indexOf(columnName);
    //     },
    //
    //     getValueByRowAndColumnIndex: function (index, columnIndex) {
    //         return this._data[index][columnIndex];
    //     },
    //
    //     getFeatureData: function (index) {
    //         return this._data[index];
    //     }
    //
    // });
    //
    //
    // /**
    //  * creates dataload/DataTable from ./Table
    //  * remove this when we get rid of dataload/DataTable abstraction
    //  * @param {ponder/Table} tabular data. must immplement ponder/Table
    //  * @returns {ponder/dataload/DataTable}
    //  */
    // DataTable.createDataTableFromTable = function (table) {
    //
    //
    //     var columns = [];
    //     var selectedOrdinals = [];
    //     var selectedCategories = [];
    //     var label;
    //     for (var i = 0; i < table.columnCount(); i += 1) {
    //         label = table.columnLabel(i);
    //         columns.push(label);
    //         if (table.columnType(i) === Table.ORDINAL) {
    //             selectedOrdinals.push(label);
    //         } else if (table.columnType(i) === Table.CATEGORY) {
    //             selectedCategories.push(label);
    //         }
    //     }
    //
    //
    //     var data = new Array(table.rowCount());
    //     var row;
    //     for (var r = 0; r < table.rowCount(); r += 1) {
    //         row = new Array(table.columnCount());
    //         for (var c = 0; c < table.columnCount(); c += 1) {
    //             row[c] = table.getValue(r, c);
    //         }
    //         data[r] = row;
    //     }
    //
    //     return new DataTable(
    //     table.getName(),
    //     data,
    //     columns,
    //     selectedOrdinals,
    //     selectedCategories
    //     );
    //
    // };
    //
    //
    // return DataTable;

});