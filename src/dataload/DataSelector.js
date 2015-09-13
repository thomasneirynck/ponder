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
        return  (position === 0 || shouldSkip(name, sampleValue)) ? "exclude" :
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
                header.innerHTML = "Select the columns with independent variables";
                headerWrapper.appendChild(header);

                var doneButton = document.createElement("input");
                doneButton.type = "button";
                doneButton.value = "Continue";
                headerWrapper.appendChild(doneButton);
                self._wrapperNode.appendChild(headerWrapper);

                var table = document.createElement("table");
                table.border = "1px solid red";

                var tableHeader = document.createElement("tr");
                var nameColHead = document.createElement("th");
                nameColHead.innerHTML = "Name";
                var ordinalColHead = document.createElement("th");
                ordinalColHead.innerHTML = "Number";
                var categoryColHead = document.createElement("th");
                categoryColHead.innerHTML = "Category";
                var ignoreColHead = document.createElement("th");
                ignoreColHead.innerHTML = "Exclude";

                var exampleColHead = document.createElement("th");
                var divver = document.createElement("div");
                var limit = Math.min(6, self._data.length);
                var spanner, e;
                for (e = 1; e < limit; e += 1) {
                    spanner = document.createElement("span");
                    spanner.innerHTML = "Sample: " + e;
                    divver.appendChild(spanner);
                }
                exampleColHead.appendChild(divver);


                tableHeader.appendChild(nameColHead);
                tableHeader.appendChild(ordinalColHead);
                tableHeader.appendChild(categoryColHead);
                tableHeader.appendChild(ignoreColHead);
                tableHeader.appendChild(exampleColHead);
                table.appendChild(tableHeader);


                var radioButtonsMap = {};
                for (var i = 0; i < self._data[0].length; i += 1) {
                    var row = document.createElement("tr");

                    var nameCol = document.createElement("td");
                    nameCol.innerHTML = self._data[0][i];
                    row.appendChild(nameCol);

                    radioButtonsMap[self._data[0][i]] = {};
                    var suggestedType = suggestType(self._data[0][i], self._data[1] ? self._data[1][i] : null, i);
                    addRadioColumn(row, radioButtonsMap, self._data[0][i], suggestedType === "ordinal", "ordinal");
                    addRadioColumn(row, radioButtonsMap, self._data[0][i], suggestedType === "category", "category");
                    addRadioColumn(row, radioButtonsMap, self._data[0][i], suggestedType === "exclude", "exclude");

                    var example = document.createElement("td");
                    divver = document.createElement("div");
                    for (e = 1; e < limit; e += 1) {
                        spanner = document.createElement("span");
                        spanner.innerHTML = self._data[e][i];
                        divver.appendChild(spanner);
                    }
                    example.appendChild(divver);
                    row.appendChild(example);
                    table.appendChild(row);
                }

                self._wrapperNode.appendChild(table);

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