define([
    "Papa",
    "type",
    "Evented",
    "jquery",
    "datatables"
], function (Papa, type, Evented, jquery) {


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
                table.cellpadding = 0;
                table.cellspacing = 0;
                table.border = 0;
                table.class = "display";
                self._wrapperNode.appendChild(table);

                jquery(table).dataTable({
                    searching: false,
                    ordering: false,
                    paging: true,
                    preview: 10,
                    "data": event.data.slice(1),
                    "pageLength": 10,
                    "columns": event.data[0].map(function (e) {
                        return {
                            title: e
                        };
                    })
                });

                self._selectedColumns = [];
                jquery("#" + table.id + " thead").on('mousedown', 'th', function (event) {
                    if (self._selectedColumns.indexOf(this.innerHTML) === -1) {
                        self._selectedColumns.push(this.innerHTML);
                        this.classList.add("selectedColumn");
                    } else {
                        self._selectedColumns.splice(self._selectedColumns.indexOf(this.innerHTML), 1);
                        this.classList.remove("selectedColumn");
                    }
                });
                jquery("#" + table.id + " thead").on('mouseenter', 'th', function (event) {
                    if (event.which === 1 && self._selectedColumns.indexOf(this.innerHTML) === -1) {
                        self._selectedColumns.push(this.innerHTML);
                        this.classList.add("selectedColumn");
                    }
                });


                jquery("#" + table.id + " thead th").hover(function (event) {
                    jquery(event.target).css('cursor', 'pointer');
                }, function () {
                    jquery(event.target).css('cursor', 'auto');
                });

                jquery(doneButton).on("click", function () {
                    self.emit("change", {
                        file: self._file,
                        data: self._data.slice(1),
                        columns: self._data[0],
                        selectedColumns: self._selectedColumns
                    });
                });

            }

        },

        destroy: function () {
            this._wrapperNode.innerHTML = "";
        }


    });


});