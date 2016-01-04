define(["type", "jStat"], function (type, jStat) {


    return type({

        constructor: function (min, max) {
            this._context2d = document.createElement("canvas").getContext("2d");
            this._context2d.width = 128;
            this._context2d.height = 128;
            this._min = min;
            this._max = max;
        },

        setData: function (data) {

            var quartiles = jStat.quartiles(data);
            this._lq = quartiles[0];
            this._median = quartiles[1];
            this._uq = quartiles[2];
            this._mi = jStat.min(data);
            this._ma = jStat.max(data);

            this.paint();

        },

        toViewX: function (x) {
            return this._context2d.canvas.width * (x - this._min) / (this._max - this._min);
        },

        paint: function () {


            var halfHeight = this._context2d.canvas.height / 2;

            this._context2d.beginPath();
            this._context2d.moveTo(this.toViewX(this._mi), halfHeight-halfHeight/2);
            this._context2d.lineTo(this.toViewX(this._mi), halfHeight+halfHeight/2);
            this._context2d.stroke();

            this._context2d.beginPath();
            this._context2d.moveTo(this.toViewX(this._mi), halfHeight);
            this._context2d.lineTo(this.toViewX(this._lq), halfHeight);
            this._context2d.stroke();

            this._context2d.strokeRect(this.toViewX(this._lq), halfHeight - halfHeight * 3 / 4, this.toViewX(this._median) - this.toViewX(this._lq), halfHeight * 6/4);
            this._context2d.strokeRect(this.toViewX(this._median), halfHeight - halfHeight * 3 / 4, this.toViewX(this._uq) - this.toViewX(this._median), halfHeight * 6/4);

            this._context2d.beginPath();
            this._context2d.moveTo(this.toViewX(this._uq), halfHeight);
            this._context2d.lineTo(this.toViewX(this._ma), halfHeight);
            this._context2d.stroke();

            this._context2d.beginPath();
            this._context2d.moveTo(this.toViewX(this._ma), halfHeight-halfHeight/2);
            this._context2d.lineTo(this.toViewX(this._ma), halfHeight+halfHeight/2);
            this._context2d.stroke();


        },

        addToNode: function (node) {
            node.appendChild(this._context2d.canvas);
        }

    });


});