define(["type", "jStat", "Evented", "jquery"], function (type, jStat, Evented, jquery) {


    return type(Evented.prototype, {

        constructor: function Boxplot(min, max, node) {
            Evented.call(this);
            this._context2d = document.createElement("canvas").getContext("2d");
            this._min = min;
            this._max = max;
            this._node = node;
            this._context2d.canvas.width = jquery(node).width();
            this._context2d.canvas.height = jquery(node).height();
            node.appendChild(this._context2d.canvas);

            var valueRead = document.createElement("div");
            valueRead.style.display = "none";
            valueRead.style.position = "absolute";
            valueRead.style.color = "rgb(255,0,0)";
            valueRead.setAttribute("data-boxplot-readout", "1");
            valueRead.style["pointer-events"] = "none";
            document.body.appendChild(valueRead);

            var self = this;
            this._context2d.canvas.addEventListener("mousemove", function (event) {

                self.paint();
                var offset = jquery(self._context2d.canvas).offset();
                self._context2d.strokeStyle = "rgb(255,0,0)";

                var rx = event.pageX - offset.left;
                self._context2d.strokeRect(rx, 0, 0, self._context2d.canvas.height);

                valueRead.style.display = "block"; valueRead.style.left = event.pageX + "px";
                valueRead.style.top = offset.top + "px";
                valueRead.innerHTML = Math.round(self.toWorldX(rx) * 100) / 100;


            });

            this._context2d.canvas.addEventListener("mouseout", function (event) {
                valueRead.style.display = "none";
                self.paint();
            });
        },

        setData: function (data) {


            data = data.filter(function (item) {
                return !isNaN(item);
            });

            if (!data.length) {
                this._context2d.clearRect(0, 0, this._context2d.canvas.width, this._context2d.canvas.height);
                return;
            }


            var quartiles = jStat.quartiles(data);
            this._lq = quartiles[0];
            this._median = quartiles[1];
            this._uq = quartiles[2];
            this._mi = jStat.min(data);
            this._ma = jStat.max(data);

            this.paint();

        },

        toWorldX: function(x){
            return x * (this._max - this._min) / this._context2d.canvas.width;
        },

        toViewX: function (x) {
            return this._context2d.canvas.width * (x - this._min) / (this._max - this._min);
        },

        paint: function () {

            this._context2d.clearRect(0, 0, this._context2d.canvas.width, this._context2d.canvas.height);

            var halfHeight = this._context2d.canvas.height / 2;

            this._context2d.strokeStyle = "#DF723E";

            this._context2d.beginPath();
            this._context2d.moveTo(this.toViewX(this._mi), halfHeight - halfHeight / 2);
            this._context2d.lineTo(this.toViewX(this._mi), halfHeight + halfHeight / 2);
            this._context2d.stroke();

            this._context2d.beginPath();
            this._context2d.moveTo(this.toViewX(this._mi), halfHeight);
            this._context2d.lineTo(this.toViewX(this._lq), halfHeight);
            this._context2d.stroke();

            this._context2d.strokeRect(this.toViewX(this._lq), halfHeight - halfHeight * 3 / 4, this.toViewX(this._median) - this.toViewX(this._lq), halfHeight * 6 / 4);
            this._context2d.strokeRect(this.toViewX(this._median), halfHeight - halfHeight * 3 / 4, this.toViewX(this._uq) - this.toViewX(this._median), halfHeight * 6 / 4);

            this._context2d.beginPath();
            this._context2d.moveTo(this.toViewX(this._uq), halfHeight);
            this._context2d.lineTo(this.toViewX(this._ma), halfHeight);
            this._context2d.stroke();

            this._context2d.beginPath();
            this._context2d.moveTo(this.toViewX(this._ma), halfHeight - halfHeight / 2);
            this._context2d.lineTo(this.toViewX(this._ma), halfHeight + halfHeight / 2);
            this._context2d.stroke();


        }

    });


});