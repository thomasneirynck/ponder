define([
    "type",
    "jquery",
    "../../util",
    "../../Table",
    "../stats/Boxplot",
    "../stats/Histogram"
], function (type, jquery, util, Table, Boxplot, Histogram) {


    return type({

        constructor: function SummaryChart(node, selectedBmuIndices, datatable) {

            node = typeof node === "string" ? document.getElementById(node) : node;

            var ordinalColumns = datatable.getColumnsByType(Table.ORDINAL);
            var categoryColumns = datatable.getColumnsByType(Table.CATEGORY);

            var ordinalValues = {};

            var i, value;
            for (var c = 0; c < ordinalColumns.length; c += 1) {
                ordinalValues[ordinalColumns[c]] = [];
                for (i = 0; i < selectedBmuIndices.length; i += 1) {
                    value = util.toNumber(datatable.getValue(selectedBmuIndices[i], ordinalColumns[c]));
                    ordinalValues[ordinalColumns[c]].push(value);
                }
            }


            var plot, label, container, minmax, box;
            this._boxes = [];
            var self = this;

            function hideAllOtherReadouts(boxplot) {
                for (var i = 0; i < self._boxes.length; i += 1) {
                    if (self._boxes[i] !== boxplot) {
                        self._boxes[i].hideReadout();
                    }
                }
            }

            for (c = 0; c < ordinalColumns.length; c += 1) {
                plot = document.createElement("div");
                plot.style.width = "100%";
                plot.style.position = "relative";
                plot.setAttribute("data-plot-type", "boxplot");

                node.appendChild(plot);//need to add so it gets width/height


                label = document.createElement("div");
                label.innerHTML = datatable.columnLabel(ordinalColumns[c]);
                plot.appendChild(label);

                container = document.createElement("div");
                container.style.position = "relative";
                plot.appendChild(container);

                minmax = datatable.getMinMax(ordinalColumns[c]);

                box = new Boxplot(minmax[0], minmax[1], container);
                box.setData(ordinalValues[ordinalColumns[c]]);

                box.on("displayReadout", hideAllOtherReadouts);


                this._boxes.push(box);
            }


            var categoryValues = [];
            for (c = 0; c < categoryColumns.length; c += 1) {
                categoryValues[categoryColumns[c]] = [];
                for (i = 0; i < selectedBmuIndices.length; i += 1) {
                    value = datatable.getValue(selectedBmuIndices[i], categoryColumns[c]);
                    categoryValues[categoryColumns[c]].push(value);
                }
            }


            var bars, counts, hist;
            for (c = 0; c < categoryColumns.length; c += 1) {
                plot = document.createElement("div");
                plot.setAttribute("data-plot-type", "histogram");

                label = document.createElement("div");
                label.innerHTML = datatable.columnLabel(categoryColumns[c]);


                bars = document.createElement("div");
                counts = datatable.getCounts(categoryColumns[c]);

                hist = new Histogram(bars, counts);
                hist.setData(categoryValues[categoryColumns[c]]);


                plot.appendChild(label);
                plot.appendChild(bars);


                node.appendChild(plot);

            }


        }

    });


});