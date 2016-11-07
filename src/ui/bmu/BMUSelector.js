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

                if (selectedIndices.length) {
                    self.selectFromIndices(selectedIndices, mapSelection);
                }else{
                    self._areaSelectLayerController.clear();
                    self.emit("clear");
                }


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


                    if (selectionEvent.stats.getIndices().length === 0) {
                        self._areaSelectLayerController.clear();
                        self.emit("clear", selectionEvent);
                    } else {
                        self.select(selectionEvent);
                        self.emit("change", selectionEvent);
                    }


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

            var indices = selectionEvent.stats.getIndices();
            var data = indices.map(function (index) {
                return self._bmuLayer.getDataTable().getFeatureData(index);
            });


            var table = document.createElement("table");
            table.cellpadding = 0;
            table.cellspacing = 0;
            table.border = 0;
            table.class = "display";
            table.id = "ponder-table";
            table.setAttribute("class","hover");
            document.getElementById(this._bmuContainer).appendChild(table);

            var daTable = jquery(table).dataTable({
                //searching: true,
                //ordering: true,
                //paging: true,
                "data": data,
                "columns": this._bmuLayer.getDataTable().getColumnLabels().map(function (e) {
                    return {
                        title: e
                    };
                })
            });

            jquery('#ponder-table tbody').on('click', 'tr', function (event) {
                if (jquery(this).hasClass('selected')) {
                    jquery(this).removeClass('selected');
                }
                else {
                    daTable.$('tr.selected').removeClass('selected');
                    jquery(this).addClass('selected');
                    if (data[event.currentTarget._DT_RowIndex]) {
                        self.emit("RowSelection", {
                            item: data[event.currentTarget._DT_RowIndex],
                            index: indices.indexOf(event.currentTarget._DT_RowIndex)
                        });
                    }
                }
            });


            document.getElementById(this._summaryContainer).innerHTML = "";
            new SummaryChart(this._summaryContainer, selectionEvent.selectedIndices, this._bmuLayer.getDataTable());


            this._areaSelectLayerController.select(selectionEvent.mapSelection);


        }


    });


});