define([
    "type",
    "jquery"
], function (type, jquery) {


    return type({
        constructor: function (node, allMins, allMaxs, selectedOrdinals) {

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
                this._context2d.fillRect(barOffset + allMins[r] * barWidth, r * stepHeight, (allMaxs[r] - allMins[r]) * barWidth, stepHeight);
                this._context2d.strokeRect(barOffset + allMins[r] * barWidth, r * stepHeight, (allMaxs[r] - allMins[r]) * barWidth, stepHeight);
            }


            this._context2d.textBaseline = "hanging";
            this._context2d.fillStyle = "rgb(0,0,0)";
            for (r = 0; r < selectedOrdinals.length; r += 1) {
                this._context2d.fillText(selectedOrdinals[r], 10, r * stepHeight);
            }

        }

    });


});