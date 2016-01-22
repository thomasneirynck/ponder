define([
    "type",
    "Evented",
    "jquery"
], function (type, Evented, $) {


    return type(Evented.prototype, {

        constructor: function Legend(legendDiv, bmuLayer) {

            Evented.call(this);
            this._legendDiv = document.getElementById(legendDiv);

            var self = this;
            this._bmuLayer = bmuLayer;
            bmuLayer.on("classChange", function (claz) {
                self._updateLegend();
            });
            self._updateLegend();

            this._break = 0.5;

            window.addEventListener("resize", function(){
                self.emit("invalidate");
            });

        },

        _updateCategoryLegend: function (legend) {
            var wrapperDiv = document.createElement("div");
            wrapperDiv.style.position = "relative";
            wrapperDiv.style.width = "100%";
            wrapperDiv.style.height = "100%";


            var itemSpan;
            for (var i = 0; i < legend.values.length; i += 1) {
                itemSpan = document.createElement("span");
                itemSpan.style.position = "absolute";
                itemSpan.style.height = "100%";
                itemSpan.style.width = (100 / legend.values.length) + "%";
                itemSpan.style.left = (100 / legend.values.length) * i + "%";
                itemSpan.style["background-color"] = legend.classifier(legend.values[i]);
                itemSpan.innerHTML = legend.values[i];
                itemSpan.title = legend.values[i];

                wrapperDiv.appendChild(itemSpan);
            }

            this._legendDiv.innerHTML = "";
            this._legendDiv.appendChild(wrapperDiv);


        },

        _updateOrdinalLegend: function (legend) {

            var context2d = document.createElement("canvas").getContext("2d");
            context2d.canvas.style.cursor = "pointer";

            var self = this;

            function paint() {
                context2d.canvas.width = $(self._legendDiv).width();
                context2d.canvas.height = $(self._legendDiv).height();

                context2d.fillStyle = legend.lower;
                context2d.fillRect(0, 0, context2d.canvas.width * self._break, context2d.canvas.height);
                context2d.fillStyle = legend.higher;
                context2d.fillRect(context2d.canvas.width * self._break, 0, context2d.canvas.width * (1 - self._break), context2d.canvas.height);

                context2d.moveTo(context2d.canvas.width * self._break, 0);
                context2d.lineTo(context2d.canvas.width * self._break, context2d.canvas.height);
                context2d.stroke();


                var readOutValue = parseFloat((legend.minMax[0] + (self._break * (legend.minMax[1] - legend.minMax[0]))).toFixed(4)).toString();

                context2d.textBaseline = "middle";
                context2d.textAlign = "center";


                context2d.shadowColor = 'rgb(23,23,23)';
                context2d.shadowOffsetX = 0;
                context2d.shadowOffsetY = 0;
                context2d.shadowBlur = 5;
                context2d.font = "'Gudea', sans-serif";
                context2d.fillStyle = "#5b3b31";
                context2d.fillText(readOutValue, context2d.canvas.width * self._break, context2d.canvas.height/2);

            }

            this._legendDiv.innerHTML = "";
            this._legendDiv.appendChild(context2d.canvas);

            paint();


            $(context2d.canvas)
                .mousemove(function (event) {
                    if (!event.which) {
                        return;
                    }
                    self._break = event.offsetX / context2d.canvas.width;
                    self.emit("invalidate");
                    paint();

                });

        },

        getBreak: function () {
            return this._break;
        },

        _updateLegend: function () {
            var legend = this._bmuLayer.getLegend();
            if (legend.type === "ORDINAL") {
                this._updateOrdinalLegend(legend);
            } else {
                this._updateCategoryLegend(legend);
            }

        }

    });

});