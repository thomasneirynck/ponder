define(["type", "Evented", "jquery"], function (type, Evented, jquery) {


    return type(Object.prototype, Evented.prototype, {

        constructor: function Map(node, worldWidth, worldHeight) {

            Evented.call(this);
            this._layers = [];
            this._animationFrameHandle = 0;

            this._worldWidth = worldWidth;
            this._worldHeight = worldHeight;

            this._context2d = document.createElement("canvas").getContext("2d");
            var container = (typeof node === "string") ? document.getElementById(node) : node;
            container.appendChild(this._context2d.canvas);

            var self = this;
            this._handleAnimationFrame = function handleAnimationFrame() {
                self._animationFrameHandle = 0;
                self._context2d.clearRect(0, 0, self._context2d.width, self._context2d.height);
                for (var i = 0; i < self._layers.length; i += 1) {
                    self._layers[i].paint(self._context2d, self);
                }
            };

            window.addEventListener("resize", this.resize.bind(this));
            this.resize();

            this._rx = 0;
            this._ry = 0;
            var mapEvent = Object.freeze({
                getMapViewX: function () {
                    return self._rx;
                },
                getMapViewY: function () {
                    return self._ry;
                }
            });

            var down = false;
            var out = false;
            jquery(this._context2d.canvas)
                .mousedown(function (event) {
                    out = false;
                    down = true;
                    self._rx = event.offsetX;
                    self._ry = event.offsetY;
                    self.emit("dragstart", mapEvent);
                })
                .mousemove(function (event) {
                    out = false;
                    if (down) {
                        self._rx = event.offsetX;
                        self._ry = event.offsetY;
                        self.emit("drag", mapEvent);
                    }
                })
                .mouseout(function (event) {
                    out = true;
                    self._rx = event.offsetX;
                    self._ry = event.offsetY;
                    self.emit("mouseout", mapEvent);
                })
                .mouseup(function (event) {
                    out = false;
                    if (down) {
                        down = false;
                        self._rx = event.offsetX;
                        self._ry = event.offsetY;
                        self.emit("dragend", mapEvent);
                    }
                });


            function updateRelativeXY(event) {
                var offset = jquery(self._context2d.canvas).offset();
                self._rx = event.pageX - offset.left;
                self._ry = event.pageY - offset.top;
            }

            jquery(window)
                .mousemove(function (event) {
                    if (down && out) {
                        updateRelativeXY(event);
                        self.emit("drag", mapEvent);
                    }
                })
                .mouseup(function (event) {
                    if (down && out) {
                        down = false;
                        updateRelativeXY(event);
                        self.emit("dragend", mapEvent);
                    }
                });

        },

        screenshot: function (context2d, layers) {
            for (var i = 0; i < this._layers.length; i += 1) {
                if (layers.indexOf(this._layers[i]) < 0) {
                    continue;
                }
                this._layers[i].paint(context2d, this);
            }
        },

        destroy: function () {
            //todo: cleanup here
        },
        toViewX: function (x, context2d) {
            return x * context2d.canvas.width / this._worldWidth;
        },

        toViewY: function (y, context2d) {
            return y * context2d.canvas.height / this._worldHeight;
        },

        toWorldX: function (x) {
            return x * this._worldWidth / this._context2d.canvas.width;
        },

        toWorldY: function (y) {
            return y * this._worldHeight / this._context2d.canvas.height;
        },

        addLayer: function (layer) {
            this._layers.push(layer);
            layer.on("invalidate", this.invalidate.bind(this));
            this.invalidate();
        },

        resize: function () {
            this._context2d.canvas.width = jquery(this._context2d.canvas).parent().width();
            this._context2d.canvas.height = jquery(this._context2d.canvas).parent().height();
            this.invalidate();
        },

        invalidate: function () {
            if (this._animationFrameHandle) {
                return;
            }
            this._animationFrameHandle = requestAnimationFrame(this._handleAnimationFrame, this._context2d.canvas);
        }

    });


});