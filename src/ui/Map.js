define(["type", "Evented", "jquery"], function (type, Evented, jquery) {


    return type(Object.prototype, Evented.prototype, {

        constructor: function Map(node, worldWidth, worldHeight) {

            Evented.call(this);
            this._layers = [];
            this._animationFrameHandle = 0;

            this._worldWidth = worldWidth;
            this._worldHeight = worldHeight;

            this._context2d = document.createElement("canvas").getContext("2d");
            this._container = (typeof node === "string") ? document.getElementById(node) : node;
            this._container.appendChild(this._context2d.canvas);

            var self = this;
            this._handleAnimationFrame = function handleAnimationFrame() {
                self._animationFrameHandle = 0;
                for (var i = 0; i < self._layers.length; i += 1) {
                    self._layers[i].paint(self._context2d, self);
                }
            };

            window.addEventListener("resize", this.resize.bind(this));
            this.resize();


            jquery(this._container)
                .mousedown(function (event) {
                    self.emit("mousedown", event);
                })
                .mousemove(function (event) {
                    self.emit("mousemove", event);
                })
                .mouseout(function (event) {
                    self.emit("mouseout", event);
                })
                .mouseup(function (event) {
                    self.emit("mouseup", event);
                });

            jquery(window)
                .mouseup(function (event) {
                    self.emit("window_mouseup", event);
                });

        },

        destroy: function(){
          //do cleanup here
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