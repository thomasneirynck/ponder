define([
    "type",
    "Evented"
], function (type, Evented) {


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

        },

        _updateLegend: function () {
            var legend = this._bmuLayer.getLegend();
            if (legend.type === "ORDINAL") {
                this._legendDiv.innerHTML = "cant do ordinal yet";
                return;
            }


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


        }


    });

});