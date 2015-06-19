define([
    "Papa",
    "type",
    "Evented",
    "jquery",
    "datatables_colvis"
], function (Papa, type, Evented, jquery, datatables_colvis) {


    return type(Object.prototype, Evented, {

        constructor: function DataSelector(node) {

            var fileSelector = document.createElement("input");
            fileSelector.type = "file";
            fileSelector.name = "files[]";

            var wrapperNode = typeof node === "string" ? document.getElementById(node) : node;
            wrapperNode.appendChild(fileSelector);


            function listen(event) {
                var file = event.target.files[0];
                if (!file) {
                    return;
                }


                Papa.parse(file, {
                    worker: true,
                    complete: showPreview,
                    skipEmptyLines: true,
                    error: function () {
                        alert("Cannot read file.");
                    }
                });
            }
            fileSelector
                .addEventListener("change", listen);

            function showPreview(event) {

                fileSelector.removeEventListener("change", listen);
                wrapperNode.removeChild(fileSelector);


                var table = document.createElement("table");
                table.cellpadding = 0;
                table.cellspacing = 0;
                table.border = 0;
                table.class = "display";
                wrapperNode.appendChild(table);

                jquery(table).dataTable({
                    searching: false,
                    ordering: false,
                    paging: true,
                    "data": event.data.slice(1),
                    "columns": event.data[0].map(function (e) {
                        return {
                            title: e
                        };
                    })
                });

                jquery("#" + table.id + " thead").on( 'click', 'th', function () {

                    api = jquery(table).DataTable();

                    var title = api.column( this ).header();

                    alert( 'Column title clicked on: '+$(title).html() );
                } );


            }

        }


    });


});