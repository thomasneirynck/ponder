define([
    "Papa",
    "type",
    "Evented",
    "jquery",
    "./DataTable",
    "./util",
    "datatables"
], function (Papa, type, Evented, jquery, DataTable, util) {


    function isOrdinal(name, sampleValue) {
        return !isNaN(util.toNumber(sampleValue));
    }

    function isCategorical(name, sampleValue) {
        return true;
    }

    function shouldSkip(name, sampleValue) {
        return (name === "class" || name === "type" || name === "id");
    }

    function suggestType(name, sampleValue, position) {
        return (position === 0 || shouldSkip(name, sampleValue)) ? "exclude" :
            isOrdinal(name, sampleValue) ? "ordinal" :
                isCategorical(name, sampleValue) ? "category" :
                    "exclude";
    }

    function addRadioColumn(parentRow, buttonsMap, radioName, checked, type) {

        var col = document.createElement("td");

        var radio = document.createElement("input");
        radio.type = "radio";
        radio.checked = checked;
        radio.name = radioName;

        buttonsMap[radioName][type] = radio;

        col.appendChild(radio);
        parentRow.appendChild(col);

    }

    return type(Object.prototype, Evented.prototype, {

        constructor: function DataSelector(node) {

            Evented.call(this);

            this._wrapperNode = typeof node === "string" ? document.getElementById(node) : node;

            var fileSelector = document.createElement("input");
            fileSelector.type = "file";
            fileSelector.name = "files[]";

            this._wrapperNode.appendChild(fileSelector);

            function listen(event) {
                self._file = event.target.files[0];
                if (!self._file) {
                    return;
                }
                Papa.parse(self._file, {
                    worker: true,
                    complete: showPreview,
                    skipEmptyLines: true,
                    error: function () {
                        alert("Cannot read file.");
                    }
                });
            }

            fileSelector.addEventListener("change", listen);

            var self = this;

            function showPreview(event) {

                fileSelector.removeEventListener("change", listen);
                self._wrapperNode.removeChild(fileSelector);
                self._data = event.data;

                self._selectedOrdinalColumns = [];
                self._selectedCategoryColumns = [];

                var headerWrapper = document.createElement("div");
                var header = document.createElement("div");
                header.innerHTML = "<div>Select the columns with the independent variables: </div>"
                    + "<div>"
                    + "<br/><strong>Number</strong>: e.g. measurements like height, weight, speed, rank or distance"
                    + "<br/><strong>Category</strong>: e.g. observations like gender, color, or diagnosis"
                    + "<br/><strong>Exclude</strong>: when selected, this field will not be taken into account when creating the map."
                    + "</div>";
                headerWrapper.appendChild(header);
                self._wrapperNode.appendChild(headerWrapper);


                var table = document.createElement("table");

                var tableHeader = document.createElement("tr");
                var nameColHead = document.createElement("th");
                nameColHead.innerHTML = "Name";
                var ordinalColHead = document.createElement("th");
                ordinalColHead.innerHTML = "Number";
                var categoryColHead = document.createElement("th");
                categoryColHead.innerHTML = "Category";
                var ignoreColHead = document.createElement("th");
                ignoreColHead.innerHTML = "Exclude";

                tableHeader.appendChild(nameColHead);
                tableHeader.appendChild(ordinalColHead);
                tableHeader.appendChild(categoryColHead);
                tableHeader.appendChild(ignoreColHead);

                var limit = Math.min(6, self._data.length);
                var exampleColHead, spanner, e;
                for (e = 1; e < limit; e += 1) {
                    exampleColHead = document.createElement("th");
                    spanner = document.createElement("span");
                    spanner.innerHTML = "";
                    exampleColHead.appendChild(spanner);
                    tableHeader.appendChild(exampleColHead)
                }

                if (e === limit) {
                    exampleColHead = document.createElement("th");
                    spanner = document.createElement("span");
                    spanner.innerHTML = " + " + (self._data.length - e) + " more";
                    exampleColHead.appendChild(spanner);
                    tableHeader.appendChild(exampleColHead);
                }


                table.appendChild(tableHeader);


                var radioButtonsMap = {};

                var row, nameCol, suggestedType, example;
                for (var i = 0; i < self._data[0].length; i += 1) {
                    row = document.createElement("tr");

                    nameCol = document.createElement("td");
                    nameCol.innerHTML = self._data[0][i];
                    row.appendChild(nameCol);

                    radioButtonsMap[self._data[0][i]] = {};
                    suggestedType = suggestType(self._data[0][i], self._data[1] ? self._data[1][i] : null, i);
                    addRadioColumn(row, radioButtonsMap, self._data[0][i], suggestedType === "ordinal", "ordinal");
                    addRadioColumn(row, radioButtonsMap, self._data[0][i], suggestedType === "category", "category");
                    addRadioColumn(row, radioButtonsMap, self._data[0][i], suggestedType === "exclude", "exclude");


                    for (e = 1; e < limit; e += 1) {
                        example = document.createElement("td");
                        spanner = document.createElement("span");
                        spanner.innerHTML = self._data[e][i];
                        example.appendChild(spanner);
                        row.appendChild(example);
                    }
                    if (e === limit){
                        example = document.createElement("td");
                        spanner = document.createElement("span");
                        spanner.innerHTML = "...";
                        example.appendChild(spanner);
                        row.appendChild(example);
                    }


                    table.appendChild(row);
                }

                var divver = document.createElement("div");
                divver.appendChild(table);
                self._wrapperNode.appendChild(divver);


                var doneButton = document.createElement("input");
                doneButton.type = "button";
                doneButton.value = "Make Map";

                self._wrapperNode.appendChild(doneButton);
                jquery(doneButton).on("click", function () {

                    for (var key in radioButtonsMap) {
                        if (radioButtonsMap[key].ordinal.checked) {
                            self._selectedOrdinalColumns.push(key);
                        } else if (radioButtonsMap[key].category.checked) {
                            self._selectedCategoryColumns.push(key);
                        }
                    }

                    var dataTable = new DataTable(self._data.slice(1), self._data[0], self._selectedOrdinalColumns, self._selectedCategoryColumns);
                    self.emit("change", dataTable);
                });

            }

        },

        destroy: function () {
            this._wrapperNode.innerHTML = "";
        }


    });


});