define([
    "Papa",
    "type",
    "Evented",
    "jquery",
    "./DataTable",
    "../util",
    "require",
    "datatables"
], function (Papa, type, Evented, jquery, DataTable, util, require) {


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

        var categories = util.getParameterByName("category");
        var ordinals = util.getParameterByName("ordinal");
        var excludes = util.getParameterByName("exclude");

        if (typeof categories === "string") {
            if (categories.split(",").indexOf(name) > -1) {
                return "category";
            }
        }

        if (typeof ordinals === "string") {
            if (ordinals.split(",").indexOf(name) > -1) {
                return "ordinal";
            }
        }

        if (typeof excludes === "string") {
            if (excludes.split(",").indexOf(name) > -1) {
                return "exclude";
            }
        }


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

        constructor: function DataSelector(fileSelectorNode, tablePreviewNode) {

            Evented.call(this);

            this._fileSelectorNode = typeof fileSelectorNode === "string" ? document.getElementById(fileSelectorNode) : fileSelectorNode;
            tablePreviewNode = typeof tablePreviewNode === "string" ? document.getElementById(tablePreviewNode) : tablePreviewNode;

            var fileSelector = document.createElement("input");
            fileSelector.type = "file";
            fileSelector.name = "files[]";

            this._fileSelectorNode.appendChild(fileSelector);

            function listenToFileSelector(event) {
                var file = event.target.files[0];
                if (!file) {
                    return;
                }
                loadWithPapa(file);
            }

            function loadWithPapa(resource, download) {

                var title = util.getParameterByName("title");
                if (!title) {
                    title = typeof resource === "string" ? resource : resource.name;
                    title = title ? title.replace(/\.[^/.]+$/, "") : "";
                    title = title.replace(/^.*[\\\/]/, '');

                }

                Papa.parse(resource, {
                    worker: true,
                    download: download,
                    complete: showPreview.bind(null, title),
                    skipEmptyLines: true,
                    error: function (e) {
                        self.emit("error", e);
                    }
                });
            }

            fileSelector.addEventListener("change", listenToFileSelector);

            var self = this;

            function showPreview(title, event) {

                if (!event) {
                    self.emit("error");
                    return;
                }

                fileSelector.removeEventListener("change", listenToFileSelector);
                self._fileSelectorNode.removeChild(fileSelector);
                self._data = event.data;

                self._selectedOrdinalColumns = [];
                self._selectedCategoryColumns = [];

                var headerWrapper = document.createElement("div");
                var header = document.createElement("div");
                header.innerHTML = "<div>Select the columns with the independent variables</div>";
                headerWrapper.appendChild(header);
                tablePreviewNode.appendChild(headerWrapper);


                var table = document.createElement("table");

                var tableHeader = document.createElement("tr");
                var nameColHead = document.createElement("th");
                nameColHead.innerHTML = "Name";
                var ordinalColHead = document.createElement("th");
                ordinalColHead.innerHTML = "Number";
                ordinalColHead.title = "measurements like height, weight, speed, rank or distance";
                var categoryColHead = document.createElement("th");
                categoryColHead.innerHTML = "Category";
                categoryColHead.title = "observations like gender, color, or diagnosis";
                var ignoreColHead = document.createElement("th");
                ignoreColHead.innerHTML = "Exclude";
                ignoreColHead.title = "this field will not be taken into account when creating the map";

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
                    tableHeader.appendChild(exampleColHead);
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

                if (self._data.length === 0) {
                    self.emit("error");
                    return;
                }
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
                    if (e === limit) {
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
                tablePreviewNode.appendChild(divver);


                var doneButton = document.createElement("input");
                doneButton.type = "button";
                doneButton.value = "Make Map";


                tablePreviewNode.appendChild(doneButton);

                self.emit("tableLoaded");

                function makeMap() {

                    for (var key in radioButtonsMap) {
                        if (radioButtonsMap[key].ordinal.checked) {
                            self._selectedOrdinalColumns.push(key);
                        } else if (radioButtonsMap[key].category.checked) {
                            self._selectedCategoryColumns.push(key);
                        }
                    }

                    var dataTable = new DataTable(title, self._data.slice(1), self._data[0], self._selectedOrdinalColumns, self._selectedCategoryColumns);

                    if (ga) {
                        ga("send", "event", "button", "makeMap", title);
                    }

                    self.emit("change", dataTable);
                }


                if (util.getParameterByName("start") === "1") {
                    makeMap();
                } else {
                    jquery(doneButton).on("click", makeMap);
                }

            }

            var tableUrl = util.getParameterByName("table");
            if (typeof tableUrl === "string" && tableUrl.length > 0) {
                tableUrl = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1) + tableUrl;
                loadWithPapa(tableUrl, true);
            }


        },

        destroy: function () {
            this._fileSelectorNode.innerHTML = "";
        }


    });


});