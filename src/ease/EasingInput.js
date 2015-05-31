define(["type", "Evented", "$"], function (type, Evented, $) {


    return type(Object.prototype, Evented.prototype, {

        constructor: function EasingInput(node) {

            this._container = (typeof node === "string") ? document.getElementById(node) : node;
            this._context2d = document.createElement("canvas").getContext("2d");


            this._a = 0.5;
            this._b = 0.5;
            Evented.call(this);

            $(this._container).append(this._context2d.canvas);
            this._context2d.canvas.width = $(this._container).width();
            this._context2d.canvas.height = $(this._container).height();

            this._ease = function (i) {
                var y = Math.log(this._a) / Math.log(this._b);
                return Math.pow(i, 1 / y);
            };

            this._draw();
        },

        getEasingFunction: function () {
            return this._ease;
        },

        _drawLine: function (line, stroke, width) {
            this._context2d.beginPath();
            this._context2d.moveTo(0, 0);
            for (var i = 0; i < line.length; i += 2) {
                this._context2d.lineTo(line[i], line[i + 1]);
            }
            this._context2d.strokeStyle = stroke;
            this._context2d.lineWidth = width;
            this._context2d.stroke();
        },

        _draw: function () {

            this._context2d.canvas.width = $(this._container).width();
            this._context2d.canvas.height = $(this._container).height();

            var map;

            var steps = 100;
            var line = new Array(steps * 2);
            for (var i = 0; i <= steps; i += 1) {
                map = this._ease(i / steps);
                line[i * 2] = i / steps * this._context2d.canvas.width;
                line[i * 2 + 1] = this._context2d.canvas.height - map * this._context2d.canvas.height;
            }


            this._drawLine(line, "rgb(255,255,255)", 5);
            this._drawLine(line, "rgb(0,0,0)", 2);

            this._context2d.save();
            this._context2d.translate(-5, -5);
            this._context2d.fillRect(this._a * this._context2d.canvas.width, this._context2d.canvas.height - this._b * this._context2d.canvas.height, 10, 10);
            this._context2d.restore();

        },


    });


});