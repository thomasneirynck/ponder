define(["type", "Evented", "jquery"], function (type, Evented, $) {

    function valid(v) {
        return (v > 0 && v < 1);
    }

    return type(Object.prototype, Evented.prototype, {

        constructor: function EasingInput(node, contrastReadout) {

            Evented.call(this);

            this._container = (typeof node === "string") ? document.getElementById(node) : node;
            this._context2d = document.createElement("canvas").getContext("2d");
            this._readoutContainer = (typeof contrastReadout === "string") ? document.getElementById(contrastReadout) : contrastReadout;
            this._a = 0.5;
            this._b = 0.5;
            this._handleWidth = 10;
            this._handleHeight = 10;

            $(this._container).append(this._context2d.canvas);
            this._context2d.canvas.width = $(this._container).width();
            this._context2d.canvas.height = $(this._container).height();

            this._ease = function (i) {
                var y = Math.log(this._a) / Math.log(this._b);
                return Math.pow(i, 1 / y);
            };

            this._projectX = function (x) {
                return x * this._context2d.canvas.width;
            };

            this._projectY = function (y) {
                return this._context2d.canvas.height - y * this._context2d.canvas.height;
            };


            var down = false;
            var self = this;

            $(this._container)
                .mousedown(function (event) {
                    var x = self._projectX(self._a);
                    var y = self._projectY(self._b);
                    if (
                        x + self._handleWidth / 2 > event.offsetX &&
                        x - self._handleWidth / 2 < event.offsetX &&
                        y + self._handleHeight / 2 > event.offsetY &&
                        y - self._handleHeight / 2 < event.offsetY
                        ) {
                        down = true;
                    }
                })
                .mousemove(function (event) {

                    if (!down) {
                        return;

                    }

                    if (valid(event.offsetX / self._context2d.canvas.width)) {
                        self._a = event.offsetX / self._context2d.canvas.width;
                    }
                    if (valid((self._context2d.canvas.height - event.offsetY) / self._context2d.canvas.height)) {
                        self._b = -(event.offsetY - self._context2d.canvas.height) / self._context2d.canvas.height;
                    }

                    self.paint();
                    self.emit("input", self);

                })
                .mouseup(function (event) {
                    down = false;
                })
                .mouseup(function (event) {
                    down = false;
                });

            window.addEventListener("resize", this.resize.bind(this));
            this.paint();

        },

        getA: function () {
            return this._a;
        },
        getB: function () {
            return this._b;
        },
        resize: function () {
            this._context2d.canvas.width = $(this._container).width();
            this._context2d.canvas.height = $(this._container).height();
            this.paint();
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

        paint: function () {

            this._context2d.clearRect(0, 0, this._context2d.canvas.width, this._context2d.canvas.height);
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

            this._readoutContainer.innerHTML =
                    Math.abs(this.getA() - this.getB()) < 0.2 ? "balanced" :
                    this.getA() > this.getB() ? "Muted" :
                    this.getA() < this.getB() > 0.58 ? "Amplified" :
                    "Balanced";

        }


    });


});