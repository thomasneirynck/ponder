define([
    "type",
    "jquery",
    "../../util",
    "../stats/Boxplot",
    "../stats/Histogram"
], function (type, jquery, util, Boxplot, Histogram) {


    return type({

        constructor: function SummaryChart(node, selectedBmuIndices, datatable) {

            node = typeof node === "string" ? document.getElementById(node) : node;
            var selectedOrdinals = datatable.getSelectedOrdinalColumns();
            var selectedCategories = datatable.getSelectedCategoryColumns();

            var ordinalValues = {};


            var i;

            for (var c = 0; c < selectedOrdinals.length; c += 1) {
                ordinalValues[selectedOrdinals[c]] = [];
                for (i = 0; i < selectedBmuIndices.length; i += 1) {
                    ordinalValues[selectedOrdinals[c]].push(util.toNumber(datatable.getValueByRowAndColumnName(selectedBmuIndices[i], selectedOrdinals[c])));
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

            for (c = 0; c < selectedOrdinals.length; c += 1) {
                plot = document.createElement("div");
                plot.style.width = "100%";
                plot.style.position = "relative";
                plot.setAttribute("data-plot-type", "boxplot");

                node.appendChild(plot);//need to add so it gets width/height


                label = document.createElement("div");
                label.innerHTML = selectedOrdinals[c];
                plot.appendChild(label);

                container = document.createElement("div");
                container.style.position = "relative";
                plot.appendChild(container);

                minmax = datatable.getMinMax(datatable.getColumnIndex(selectedOrdinals[c]));

                box = new Boxplot(minmax[0], minmax[1], container);
                box.setData(ordinalValues[selectedOrdinals[c]]);

                box.on("displayReadout", hideAllOtherReadouts);


                this._boxes.push(box);
            }


            var categoryValues = [];
            for (c = 0; c < selectedCategories.length; c += 1) {
                categoryValues[selectedCategories[c]] = [];
                for (i = 0; i < selectedBmuIndices.length; i += 1) {
                    categoryValues[selectedCategories[c]].push(datatable.getValueByRowAndColumnName(selectedBmuIndices[i], selectedCategories[c]));
                }
            }


            var bars, counts, hist;
            for (c = 0; c < selectedCategories.length; c += 1) {
                plot = document.createElement("div");
                plot.setAttribute("data-plot-type", "histogram");

                label = document.createElement("div");
                label.innerHTML = selectedCategories[c];


                bars = document.createElement("div");
                counts = datatable.getCounts(datatable.getColumnIndex(selectedCategories[c]));
                hist = new Histogram(bars, counts);
                hist.setData(categoryValues[selectedCategories[c]]);


                plot.appendChild(label);
                plot.appendChild(bars);


                node.appendChild(plot);

            }


        }

    });


});