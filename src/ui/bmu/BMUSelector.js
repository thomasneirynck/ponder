define([
    "type",
    "./SummaryChart",
    "jquery",
    "datatables"], function (type, SummaryChart, jquery) {


    return type({

        constructor: function BMUSelector(areaSelectLayerController, bmuLayer, somHandle, bmuContainer, summaryContainer) {

            this._areaSelectLayerController = areaSelectLayerController;


            var bmus = bmuLayer.getBmus();
            this._areaSelectLayerController.on("change", function () {

                var selectedIndices = [];
                for (var i = 0; i < bmus.length; i += 1) {
                    if (areaSelectLayerController.isInsideSelectedWorldArea(bmus[i].x, bmus[i].y)) {
                        selectedIndices.push(i);
                    }
                }

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

                        //this is wrong! this should work with bmu values, not SOM map values
//                        document.getElementById(summaryContainer).innerHTML = "";
//                        new SummaryChart(summaryContainer, stats.getMins(), stats.getMaxs(), bmuLayer.getDataTable().getSelectedOrdinalColumns());


                        //all ordinals should get box plot



                        //all categories should get pie chart




                    }, function (e) {
                        throw e;
                    }).then(Function.prototype, function (e) {
                        throw e;
                    });


            });

        }


    });


});