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
        return  position === 0 || shouldSkip(name, sampleValue) ? "exclude" :
            isOrdinal(name, sampleValue) ? "ordinal" :
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
//                var categoryColHead = document.createElement("th");
//                categoryColHead.innerHTML = "Category";
                var ignoreColHead = document.createElement("th");
                ignoreColHead.innerHTML = "Exclude";
                tableHeader.appendChild(nameColHead);
                tableHeader.appendChild(ordinalColHead);
//                tableHeader.appendChild(categoryColHead);
                tableHeader.appendChild(ignoreColHead);
                table.appendChild(tableHeader);


                var radioButtonsMap = {};
                for (var i = 0; i < self._data[0].length; i += 1) {
                    var row = document.createElement("tr");

                    var nameCol = document.createElement("td");
                    nameCol.innerHTML = self._data[0][i];
                    row.appendChild(nameCol);

                    radioButtonsMap[self._data[0][i]] = {};
                    var suggestedType = suggestType(self._data[0][i], self._data[1] ? self._data[1][i] : null, i);
                    addRadioColumn(row, radioButtonsMap, self._data[0][i], suggestedType === "ordinal","ordinal");
                    addRadioColumn(row, radioButtonsMap, self._data[0][i], suggestedType === "exclude","exclude");

                    table.appendChild(row);
                }

                self._wrapperNode.appendChild(table);
//
//                var table = document.createElement("table");
//                table.cellpadding = 0;
//                table.cellspacing = 0;
//                table.border = 0;
//                table.class = "display";
//                self._wrapperNode.appendChild(table);
//
//                jquery(table).dataTable({
//                    searching: false,
//                    ordering: false,
//                    paging: true,
//                    preview: 10,
//                    "data": event.data.slice(1),
//                    "pageLength": 10,
//                    "columns": event.data[0].map(function (e) {
//                        return {
//                            title: e
//                        };
//                    })
//                });
//

//                jquery("#" + table.id + " thead").on('mousedown', 'th', function (event) {
//                    if (self._selectedOrdinalColumns.indexOf(this.innerHTML) === -1) {
//                        self._selectedOrdinalColumns.push(this.innerHTML);
//                        this.classList.add("selectedColumn");
//                    } else {
//                        self._selectedOrdinalColumns.splice(self._selectedOrdinalColumns.indexOf(this.innerHTML), 1);
//                        this.classList.remove("selectedColumn");
//                    }
//                });
//                jquery("#" + table.id + " thead").on('mouseenter', 'th', function (event) {
//                    if (event.which === 1 && self._selectedOrdinalColumns.indexOf(this.innerHTML) === -1) {
//                        self._selectedOrdinalColumns.push(this.innerHTML);
//                        this.classList.add("selectedColumn");
//                    }
//                });
//
//
//                jquery("#" + table.id + " thead th").hover(function (event) {
//                    jquery(event.target).css('cursor', 'pointer');
//                }, function () {
//                    jquery(event.target).css('cursor', 'auto');
//                });


                jquery(doneButton).on("click", function () {

                    for (var key in radioButtonsMap){
                        if (radioButtonsMap[key].ordinal.checked){
                            self._selectedOrdinalColumns.push(key);
                        }
                    }

                    var dataTable = new DataTable(self._data.slice(1), self._data[0], self._selectedOrdinalColumns);
                    self.emit("change", dataTable);
                });

            }

        },

        destroy: function () {
            this._wrapperNode.innerHTML = "";
        }


    });


});