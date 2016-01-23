define([
    "type",
    "jquery",
    "../../dataload/util",
    "../stats/Boxplot",
    "plotly"
], function (type, jquery, util,Boxplot, plotly) {


    return type({

        constructor: function SummaryChart(node, selectedBmuIndices, datatable) {

            node = typeof node === "string" ? document.getElementById(node) : node;
            var selectedOrdinals = datatable.getSelectedOrdinalColumns();

            var values = {};


            var i;

            for (var c = 0; c < selectedOrdinals.length; c += 1) {
                values[selectedOrdinals[c]] = [];
                for (i = 0; i < selectedBmuIndices.length; i += 1) {
                    values[selectedOrdinals[c]].push(util.toNumber(datatable.getValueByRowAndColumnName(selectedBmuIndices[i], selectedOrdinals[c])));
                }
            }



            for (c = 0; c < selectedOrdinals.length; c += 1) {
                var ordinalplot = document.createElement("div");
                ordinalplot.style.width = "100%";
                ordinalplot.style.position = "relative";

                node.appendChild(ordinalplot);

                var label = document.createElement("div");
                label.innerHTML = selectedOrdinals[c];

                ordinalplot.appendChild(label);


                var container = document.createElement("div");
                ordinalplot.appendChild(container);

                var minmax = datatable.getMinMax(datatable.getColumnIndex(selectedOrdinals[c]));
                var box = new Boxplot(minmax[0],minmax[1], container);
                box.setData(values[selectedOrdinals[c]]);




            }


        }

    });


});