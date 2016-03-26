define(["type", "Evented", "jquery"], function (type, Evented, jquery) {


    return type(Object.prototype, Evented.prototype, {

        constructor: function Map(node, worldWidth, worldHeight) {

            Evented.call(this);
            this._layers = [];
            this._animationFrameHandle = 0;

            this._worldWidth = worldWidth;
            this._worldHeight = worldHeight;

            this._balloonDiv = document.createElement("div");
            this._balloonDiv.style.display = "none";
            this._balloonDiv.style.position = "absolute";
            this._balloonDiv.style.top = 0;
            this._balloonDiv.style["pointer-events"] = "none";
            this._balloonDiv.setAttribute("data-ponder-type", "balloon");


            this._context2d = document.createElement("canvas").getContext("2d");
            this._context2d.canvas.addEventListener("contextmenu", function (e) {
                e.preventDefault();
            });


            var container = (typeof node === "string") ? document.getElementById(node) : node;
            container.appendChild(this._balloonDiv);
            container.appendChild(this._context2d.canvas);


            var self = this;
            this._handleAnimationFrame = function handleAnimationFrame() {
                self._animationFrameHandle = 0;
                self._context2d.clearRect(0, 0, self._context2d.width, self._context2d.height);
                for (var i = 0; i < self._layers.length; i += 1) {
                    self._layers[i].paint(self._context2d, self);
                }
            };


            this._rx = 0;
            this._ry = 0;
            this._mx = 0;
            this._my = 0;
            var mapEvent = Object.freeze({
                getMapViewX: function () {
                    return self._mx;
                },
                getMapViewY: function () {
                    return self._my;
                }
            });

            var down = false;
            var out = false;
            var waitingHandle = null;

            function idle() {
                self.emit("idle", mapEvent);
                waitingHandle = null;
            }

            function cancelIdle() {
                clearTimeout(waitingHandle);
                waitingHandle = null;
            }

            function updateRelativeXY(event) {
                var offset = jquery(self._context2d.canvas).offset();
                self._rx = event.pageX - offset.left;
                self._ry = event.pageY - offset.top;
                self._mx = self._rx;
                self._my = self._ry;
            }

            function updateRelativeMousePosition(event) {
                self._mx = event.offsetX;
                self._my = event.offsetY;
            }

            jquery(this._context2d.canvas)
                .mousedown(function (event) {
                    cancelIdle();
                    out = false;
                    down = true;
                    updateRelativeMousePosition(event);
                    self.emit("dragstart", mapEvent);
                })
                .mousemove(function (event) {

                    cancelIdle();
                    out = false;

                    updateRelativeMousePosition(event);

                    if (down) {
                        self.emit("drag", mapEvent);
                    } else {
                        self.emit("move", mapEvent);
                    }
                    waitingHandle = setTimeout(idle, 500);
                })
                .mouseout(function (event) {
                    cancelIdle();
                    out = true;
                    updateRelativeMousePosition(event);
                    self.emit("mouseout", mapEvent);
                })
                .mouseup(function (event) {
                    cancelIdle();
                    out = false;
                    if (down) {
                        down = false;
                        updateRelativeMousePosition(event);
                        self.emit("dragend", mapEvent);
                    }
                })
                .click(function (event) {
                    self.emit("click", mapEvent);
                });


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


            window.addEventListener("resize", this.resize.bind(this));
            this.resize();

        },


        hideBalloon: function () {
            this._balloonDiv.style.display = "none";
        },

        hasBalloon: function () {
            return this._balloonDiv.style.display === "block";
        },

        showBalloon: function (x, y, content) {
            this._balloonDiv.innerHTML = "";
            this._balloonDiv.appendChild(content);
            this._balloonDiv.style.display = "block";
        },


        screenshot: function (context2d, layers) {
            var oldContext2d = this._context2d;
            this._context2d = context2d;
            for (var i = 0; i < this._layers.length; i += 1) {
                if (layers.indexOf(this._layers[i]) < 0) {
                    continue;
                }
                this._layers[i].paint(context2d, this);
            }
            this._context2d = oldContext2d;
        },

        forEachLayer: function (callback) {
            this._layers.forEach(callback);
        },

        pick: function (x, y) {

            var self = this;
            return this._layers.reduce(function (accumulator, layer) {
                if (typeof layer.find !== "function") {
                    return accumulator;
                }
                var items = layer.find(x, y, self, self._context2d);
                accumulator.push({
                    layer: layer,
                    items: items
                });
                return accumulator;
            }, []);

        },

        destroy: function () {
            //todo: cleanup here
        },


        toViewX: function (x) {
            return x * this._context2d.canvas.width / this._worldWidth;
        },

        toViewY: function (y) {
            return y * this._context2d.canvas.height / this._worldHeight;
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