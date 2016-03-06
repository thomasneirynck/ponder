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

            window.addEventListener("resize", function () {
                self._updateLegend();
                self.emit("invalidate");
            });

        },

        _updateCategoryLegend: function (legend) {
            var wrapperDiv = document.createElement("div");
            wrapperDiv.style.position = "relative";
            wrapperDiv.style.width = "100%";
            wrapperDiv.style.height = "100%";


            var self = this;

            function highlight(event) {
                var selection = self._bmuLayer.filterBmus(self._bmuLayer.getClass(), event.target.title);
                self._bmuLayer.highlight(selection);
            }

            function removeHighlight() {
                self._bmuLayer.highlight(Array.prototype);
            }

            var itemSpan;
            var maxItems = Math.min(legend.values.length,256);//magix number based on colors
            for (var i = 0; i < maxItems; i += 1) {
                itemSpan = document.createElement("span");
                itemSpan.style.position = "absolute"; itemSpan.style.top = 0;
                itemSpan.style.height = "100%";
                itemSpan.style.width = (100 / maxItems) + "%";
                itemSpan.style.left = (100 / maxItems) * i + "%";
                itemSpan.style["background-color"] = legend.classifier(legend.values[i]);
                itemSpan.innerHTML = legend.values[i];
                itemSpan.title = legend.values[i];

                wrapperDiv.appendChild(itemSpan);

                itemSpan.addEventListener("mouseenter", highlight);

            }
            wrapperDiv.addEventListener("mouseout", removeHighlight);

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

                context2d.beginPath();
                context2d.moveTo(context2d.canvas.width * self._break, 0);
                context2d.lineTo(context2d.canvas.width * self._break, context2d.canvas.height);
                context2d.stroke();

                //arrow
                context2d.beginPath();
                context2d.moveTo(context2d.canvas.width * self._break - 20, context2d.canvas.height / 2);
                context2d.lineTo(context2d.canvas.width * self._break - 40, context2d.canvas.height / 2);
                context2d.lineTo(context2d.canvas.width * self._break - 30, context2d.canvas.height / 3);
                context2d.moveTo(context2d.canvas.width * self._break - 40, context2d.canvas.height / 2);
                context2d.lineTo(context2d.canvas.width * self._break - 30, context2d.canvas.height * 2 / 3);
                context2d.moveTo(context2d.canvas.width * self._break + 20, context2d.canvas.height / 2);
                context2d.lineTo(context2d.canvas.width * self._break + 40, context2d.canvas.height / 2);
                context2d.lineTo(context2d.canvas.width * self._break + 30, context2d.canvas.height / 3);
                context2d.moveTo(context2d.canvas.width * self._break + 40, context2d.canvas.height / 2);
                context2d.lineTo(context2d.canvas.width * self._break + 30, context2d.canvas.height * 2 / 3);
                context2d.strokeStyle = "rgb(122,122,122)";
                context2d.stroke();


                var readOutValue = parseFloat((legend.minMax[0] + (self._break * (legend.minMax[1] - legend.minMax[0]))).toFixed(4)).toString();
                context2d.textBaseline = "middle";
                context2d.textAlign = "left";
                context2d.shadowColor = 'rgb(23,23,23)';
                context2d.font = "'Gudea', sans-serif";
                context2d.fillStyle = "#5b3b31";
                context2d.fillText(readOutValue, context2d.canvas.width * self._break + 2, context2d.canvas.height / 5);

            }

            context2d.canvas.title = "drag to adjust classifier cutoff";
            this._legendDiv.innerHTML = "";
            this._legendDiv.appendChild(context2d.canvas);


            paint();

            var down = false;

            function update(event) {
                if (!down) {
                    return;
                }
                self._break = event.offsetX / context2d.canvas.width;
                self.emit("invalidate");
                paint();

            }

            function cancel(){
                down = false;
            }


            $(context2d.canvas)
                .mousedown(function(){
                    down = true;
                })
                .mouseout(cancel)
                .mouseup(cancel)
                .mousemove(update)
                .click(update);

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