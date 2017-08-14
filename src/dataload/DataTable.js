define(["type", "../util", "../Table"], function (type, util, Table) {


    return type(Table.prototype, {

        constructor: function DataTableComposed(tableImplementingPonderTable) {
            this._table = tableImplementingPonderTable;

            //caches
            this._uniqueValues = null;
            this._minMax = null;


            this._categoryCounts = null;
            this._tagCounts = null;
            this._uniqueTags = null;
        },

        dumpStructureToJson: function () {
            return JSON.parse(JSON.stringify({
                uniqueValues: this._uniqueValues,
                minMax: this._minMax,
                categoryCounts: this._categoryCounts,
                uniqueTags: this._uniqueTags,
                tagCounts: this._tagCounts
            }));
        },

        overrideStructureFromJson: function (json) {
            this._uniqueValues = json.uniqueValues;
            this._minMax = json.minMax;
            this._categoryCounts = json.categoryCounts;
            this._tagCounts = json.tagCounts;
            this._uniqueTags = json.uniqueTags;
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

            if (!this._minMax) {
                this._minMax = {};
            }

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

            if (!this._uniqueValues) {
                this._uniqueValues = {};
            }

            if (this._uniqueValues[columnIndex]) {
                return this._uniqueValues[columnIndex];
            }

            this._uniqueValues[columnIndex] = [];
            for (var i = 0; i < this._table.rowCount(); i += 1) {
                if (this._uniqueValues[columnIndex].indexOf(this.getValue(i, columnIndex)) < 0) {
                    this._uniqueValues[columnIndex].push(this.getValue(i, columnIndex));
                    if (this._uniqueValues[columnIndex].length > 256) {
                        break;
                    }
                }
            }
            return this._uniqueValues[columnIndex];
        },

        getUniqueTags: function (columnIndex) {

            if (!this._uniqueTags) {
                this._uniqueTags = {};
            }

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

            if (!this._categoryCounts) {
                this._categoryCounts = {};
            }

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

            if (!this._tagCounts) {
                this._tagCounts = {};
            }

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
            var mins = [], maxs = [];
            var mima, c;
            for (c = 0; c < selectedOrdinalColumnsIndices.length; c += 1) {
                mima = this.getMinMax(selectedOrdinalColumnsIndices[c]);
                mins[c] = mima[0];
                maxs[c] = mima[1];
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
                console.log(allTags[i].uniqueTags);
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
            //todo!!!! this is wrong. This shoudl create a two fields for a single tag, w ith weght 0.5.
            //todo!!!!
            //this way, you get the same result as if each tag was its own category field!!!!!!!
            for (c = 0; c < allTags.length; c += 1) {
                for (i = 0; i < allTags[c].uniqueTags.length; i += 1) {
                    // codebookWeights.push(1 / allTags[c].uniqueTags.length);
                    codebookWeights.push(1 / 2);
                    // codebookWeights.push(1 / 2);
                }
            }

            //FILL THE DATA
            //todo: take into account here unknown values or values outside of range (because it's possible that we overrode the table-structure!)
            var dataArray = new Array(this._table.rowCount() * (selectedOrdinalColumnsIndices.length + totCategories + totTags));

            var v, tagcount, r, value;
            for (i = 0, r = 0; r < this._table.rowCount(); r += 1) {//

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
                        // dataArray[i] = this._table.hasTag(r, allTags[c].columnIndex, allTags[c].uniqueTags[v]) ? 1 /tagcount : 0;
                        // i += 1;
                        if (this._table.hasTag(r, allTags[c].columnIndex, allTags[c].uniqueTags[v])) {
                            dataArray[i] = 1;
                            // dataArray[i + 1] = 0;
                        } else {
                            dataArray[i] = 0;
                            // dataArray[i + 1] = 1;
                        }
                        // i += 2;
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