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
                itemSpan.style.padding = 2;
                itemSpan.style["text-align"] = "center";
                itemSpan.style["text-shadow"] = "-1px -1px 0 #000,                1px -1px 0 #000, -1px  1px 0 #000,1px  1px 0 #000";

                itemSpan.style["vertical-align"] = "middle";
                itemSpan.style.color = "rgb(255,255,255)";
                itemSpan.style["background-color"] = legend.classifier(legend.values[i]);
                itemSpan.innerHTML = legend.values[i];

                wrapperDiv.appendChild(itemSpan);
            }

            this._legendDiv.innerHTML = "";
            this._legendDiv.appendChild(wrapperDiv);
        },

        _updateOrdinalLegend: function (legend) {

            var context2d = document.createElement("canvas").getContext("2d");

            function paint(){
                context2d.canvas.width = $(this._legendDiv).width();
                context2d.canvas.height = $(this._legendDiv).height();

                context2d.fillStyle = legend.lower;
                context2d.fillRect(0, 0, context2d.canvas.width * this._break, context2d.canvas.height);
                context2d.fillStyle = legend.higher;
                context2d.fillRect(context2d.canvas.width * this._break, 0, context2d.canvas.width * (1 - this._break), context2d.canvas.height);

                context2d.moveTo(context2d.canvas.width * this._break, 0);
                context2d.lineTo(context2d.canvas.width * this._break, context2d.canvas.height);
                context2d.stroke();
            }
            this._legendDiv.innerHTML = "";
            this._legendDiv.appendChild(context2d.canvas);

            paint();

            var self = this;
            $(context2d.canvas)
                .mouseover(function(event){
                    self._break = event.offsetX/context2d.canvas.width;
                    self.emit("invalidate");
                });

        },

        getBreak: function(){
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