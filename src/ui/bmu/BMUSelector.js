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
            this._bmuContainer = bmuContainer;
            this._bmuLayer = bmuLayer;
            this._summaryContainer = summaryContainer;
            this._somHandle = somHandle;

            var self = this;
            this._areaSelectLayerController.on("change", function (mapSelection) {

                var selectedIndices = bmuLayer.selectBmusFromController(areaSelectLayerController);
                self.selectFromIndices(selectedIndices, mapSelection);


            });

        },

        selectFromIndices: function (selectedIndices, mapSelection) {
            var self = this;
            this._somHandle
                .statistics(selectedIndices)
                .then(function (stats) {


                    var selectionEvent = {
                        selectedIndices: selectedIndices,
                        stats: stats,
                        mapSelection: mapSelection
                    };


                    self.select(selectionEvent);
                    self.emit("change", selectionEvent);


                }, function (e) {
                    throw e;
                }).then(Function.prototype, function (e) {
                    throw e;
                });
        },

        selectAll: function () {

            var selectedIndices = this._bmuLayer.getBmuIndices();
            this.selectFromIndices(selectedIndices);

        },

        select: function (selectionEvent) {

            var self = this;


            document.getElementById(this._bmuContainer).innerHTML = "";
            if (selectionEvent.stats.getIndices().length === 0) {
                return;
            }


            var data = selectionEvent.stats.getIndices().map(function (index) {
                return self._bmuLayer.getDataTable().getFeatureData(index);
            });


            var table = document.createElement("table");
            table.cellpadding = 0;
            table.cellspacing = 0;
            table.border = 0;
            table.class = "display";
            document.getElementById(this._bmuContainer).appendChild(table);

            jquery(table).dataTable({
                searching: true,
                ordering: true,
                paging: true,
                "data": data,
                "columns": this._bmuLayer.getDataTable().getColumns().map(function (e) {
                    return {
                        title: e
                    };
                })
            });

            document.getElementById(this._summaryContainer).innerHTML = "";
            new SummaryChart(this._summaryContainer, selectionEvent.selectedIndices, this._bmuLayer.getDataTable());


            this._areaSelectLayerController.select(selectionEvent.mapSelection);


        }


    });


});