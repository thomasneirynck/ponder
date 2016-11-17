define(["type", "../util", "../Table"], function (type, util, Table) {


    return type(Table.prototype, {


        constructor: function DataTableComposed(table) {
            this._table = table;

            //caches
            this._uniques = {};
            this._minMax = {};
            this._categoryCounts = {};
            this._tagCounts = {};
            this._uniqueTags = {};


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

        getTagCount: function (row, col) {
            return this._table.getTagCount(row, col);
        },

        getTagValue: function (row, col, tag) {
            return this._table.getTagValue(row, col, tag);
        },

        hasTag: function (row, col, tag) {
            return this._table.hasTag(row, col, tag);
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

        getUniqueTags: function (columnIndex) {
            if (this._uniqueTags[columnIndex]) {
                return this._uniqueTags[columnIndex];
            }

            this._uniqueTags[columnIndex] = [];
            var tagCount, tag;
            for (var r = 0; r < this._table.rowCount(); r += 1) {
                tagCount = this._table.getTagCount(r, columnIndex);
                for (var i = 0; i < tagCount; i += 1) {
                    tag = this._table.getTagValue(r, columnIndex, i);
                    if (this._uniqueTags[columnIndex].indexOf(tag) < 0) {
                        this._uniqueTags[columnIndex].push(tag);
                    }
                }
            }
            this._uniqueTags[columnIndex].sort();
            return this._uniqueTags[columnIndex];
        },

        getCountsPerCategory: function (columnIndex) {

            if (this._categoryCounts[columnIndex]) {
                return this._categoryCounts[columnIndex];
            }

            var uniques = this.getUniqueValues(columnIndex);

            this._categoryCounts[columnIndex] = {};
            for (var u = 0; u < uniques.length; u += 1) {
                this._categoryCounts[columnIndex][uniques[u]] = 0;
            }

            for (var i = 0; i < this._table.rowCount(); i += 1) {
                this._categoryCounts[columnIndex][this._table.getValue(i, columnIndex)] += 1;
            }

            return this._categoryCounts[columnIndex];

        },

        getCountsPerTag: function (columnIndex) {
            if (this._tagCounts[columnIndex]) {
                return this._tagCounts[columnIndex];
            }

            var uniques = this.getUniqueTags(columnIndex);

            this._tagCounts[columnIndex] = {};
            for (var u = 0; u < uniques.length; u += 1) {
                this._tagCounts[columnIndex][uniques[u]] = 0;
            }

            for (var i = 0; i < this._table.rowCount(); i += 1) {
                var tagCount = this._table.getTagCount(i, columnIndex);
                for (var t = 0; t < tagCount; t += 1) {
                    var tag = this._table.getTagValue(i, columnIndex, t);
                    this._tagCounts[columnIndex][tag] += 1;
                }
            }

            return this._tagCounts[columnIndex];

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
            var selectedTaglistColumnIndices = [];
            var i;
            for (i = 0; i < this._table.columnCount(); i += 1) {
                if (this._table.columnType(i) === Table.ORDINAL) {
                    selectedOrdinalColumnsIndices.push(i);
                } else if (this._table.columnType(i) === Table.CATEGORY) {
                    selectedCategoryColumnIndices.push(i);
                } else if (this._table.columnType(i) === Table.TAGLIST) {
                    selectedTaglistColumnIndices.push(i);
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
                    columnIndex: selectedCategoryColumnIndices[i],
                    uniqueValues: this.getUniqueValues(selectedCategoryColumnIndices[i])
                };
                totCategories += categories[i].uniqueValues.length;
            }

            //TAGLIST PREP
            var allTags = [];
            var totTags = 0;
            for (i = 0; i < selectedTaglistColumnIndices.length; i += 1) {
                allTags[i] = {
                    columnIndex: selectedTaglistColumnIndices[i],
                    uniqueTags: this.getUniqueTags(selectedTaglistColumnIndices[i])
                };
                totTags += allTags[i].uniqueTags.length;
            }


            //WEIGHTS ORDINALS
            var codebookWeights = [];
            for (i = 0; i < selectedOrdinalColumnsIndices.length; i += 1) {
                codebookWeights.push(1);
            }

            //WEIGHTS CATEGORY
            for (c = 0; c < categories.length; c += 1) {
                for (i = 0; i < categories[c].uniqueValues.length; i += 1) {
                    codebookWeights.push(1 / categories[c].uniqueValues.length);
                }
            }

            //WEIGHTS TAGLIST
            for (c = 0; c < allTags.length; c += 1) {
                for (i = 0; i < allTags[c].uniqueTags.length; i += 1) {
                    codebookWeights.push(1 / allTags[c].uniqueTags.length);
                }
            }

            //FILL THE DATA
            var dataArray = new Array(this._table.rowCount() * (selectedOrdinalColumnsIndices.length + totCategories + totTags));

            var v, tagcount;
            for (i = 0, r = 0; r < this._table.rowCount(); r += 1) {

                //scale ordinals to [0,1] domain
                for (c = 0; c < selectedOrdinalColumnsIndices.length; c += 1, i += 1) {
                    value = util.toNumber(this._table.getValue(r, selectedOrdinalColumnsIndices[c]));
                    if (isNaN(value)) {
                        console.warn("Missing value for: " + " row: " + r + ", col: " + c);
                        value = (maxs[c] + mins[c]) / 2;
                    }
                    dataArray[i] = (maxs[c] - mins[c]) !== 0 ? (value - mins[c]) / (maxs[c] - mins[c]) : 1;
                }

                //categories
                for (c = 0; c < categories.length; c += 1) {
                    for (v = 0; v < categories[c].uniqueValues.length; v += 1) {
                        dataArray[i] = (categories[c].uniqueValues[v] === this._table.getValue(r, categories[c].columnIndex)) ? 1 : 0;
                        i += 1;
                    }
                }

                //uniquetags

                for (c = 0; c < allTags.length; c += 1) {
                    tagcount = this._table.getTagCount(r, allTags[c].columnIndex);
                    for (v = 0; v < allTags[c].uniqueTags.length; v += 1) {
                        dataArray[i] = this._table.hasTag(r, allTags[c].columnIndex, allTags[c].uniqueTags[v]) ? 1 /tagcount : 0;
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