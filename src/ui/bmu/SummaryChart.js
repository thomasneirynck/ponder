define([
    "type",
    "jquery",
    "../../dataload/util"
], function (type, jquery,util) {


    return type({
        constructor: function (node, selectedBmuIndices, datatable) {



            var selectedOrdinals = datatable.getSelectedOrdinalColumns();
            var allMins = new Array(selectedOrdinals.length);
            var allMaxs = new Array(selectedOrdinals.length);

            for (var i = 0; i < selectedOrdinals.length; i += 1){
                allMins[i] = Infinity;
                allMaxs[i] = -Infinity;
            }

            for (i = 0; i < selectedBmuIndices.length; i += 1){
                for (var c = 0; c <selectedOrdinals.length; c += 1) {
                    allMins[c] = Math.min(allMins[c], util.toNumber(datatable.getValueByRowAndColumnName(selectedBmuIndices[i], selectedOrdinals[c])));
                    allMaxs[c] = Math.max(allMaxs[c], util.toNumber(datatable.getValueByRowAndColumnName(selectedBmuIndices[i], selectedOrdinals[c])));
                }
            }

            this._context2d = document.createElement("canvas").getContext("2d");
            this._wrapperNode = typeof node === "string" ? document.getElementById(node) : node;
            this._wrapperNode.appendChild(this._context2d.canvas);

            this._context2d.canvas.width = jquery(this._context2d.canvas).parent().width();
            this._context2d.canvas.height = jquery(this._context2d.canvas).parent().height();

            var stepHeight = this._context2d.canvas.height / selectedOrdinals.length;

            var barOffset = 40;
            var barWidth = this._context2d.canvas.width - barOffset;

            for (var r = 0; r < selectedOrdinals.length; r += 1) {
                this._context2d.strokeRect(barOffset, r * stepHeight, barWidth, stepHeight);
            }

            //th
            this._context2d.fillStyle = "rgb(125,125,125)";
            for (r = 0; r < selectedOrdinals.length; r += 1) {

                var minmax = datatable.getMinMax(datatable.getColumnIndex(selectedOrdinals[r]));

                var start = (allMins[r] -minmax[0]) / (minmax[1] - minmax[0]);
                var end = (allMaxs[r] -minmax[0]) / (minmax[1] - minmax[0]);

                this._context2d.fillRect(barOffset + start  * barWidth, r * stepHeight, (end - start) * barWidth, stepHeight);
                this._context2d.strokeRect(barOffset + start * barWidth, r * stepHeight, (end - start) * barWidth, stepHeight);
            }


            this._context2d.textBaseline = "hanging";
            this._context2d.fillStyle = "rgb(0,0,0)";
            for (r = 0; r < selectedOrdinals.length; r += 1) {
                this._context2d.fillText(selectedOrdinals[r], 10, r * stepHeight);
            }

        }

    });


});