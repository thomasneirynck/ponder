define([
    "type",
    "./SummaryChart",
    "jquery",
    "Evented",
    "datatables"
], function (type, SummaryChart, jquery, Evented) {


    return type(Evented.prototype, {

        constructor: function BMUSelector(areaSelectLayerController, bmuLayer, somHandle, bmuContainer, summaryContainer) {

            Evented.call(this);

            this._areaSelectLayerController = areaSelectLayerController;

            var self = this;
            this._areaSelectLayerController.on("change", function (areaSelectLayerController) {

                var selectedIndices = bmuLayer.selectBmusFromController(areaSelectLayerController);


                somHandle
                    .statistics(selectedIndices)
                    .then(function (stats) {


                        var data = stats.getIndices().map(function (index) {
                            return bmuLayer.getDataTable().getFeatureData(index);
                        });

                        document.getElementById(bmuContainer).innerHTML = "";

                        var table = document.createElement("table");
                        table.cellpadding = 0;
                        table.cellspacing = 0;
                        table.border = 0;
                        table.class = "display";
                        document.getElementById(bmuContainer).appendChild(table);

                        jquery(table).dataTable({
                            searching: true,
                            ordering: true,
                            paging: true,
                            "data": data,
                            "columns": bmuLayer.getDataTable().getColumns().map(function (e) {
                                return {
                                    title: e
                                };
                            })
                        });

                        document.getElementById(summaryContainer).innerHTML = "";
                        new SummaryChart(summaryContainer, selectedIndices, bmuLayer.getDataTable());

                        self.emit("change", {
                            selectedIndices: selectedIndices,
                            stats: stats
                        });


                    }, function (e) {
                        throw e;
                    }).then(Function.prototype, function (e) {
                        throw e;
                    });


            });

        }


    });


});