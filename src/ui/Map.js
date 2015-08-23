define(["type", "Evented", "jquery"], function (type, Evented, jquery) {


    return type(Object.prototype, Evented.prototype, {

        constructor: function Map(node) {
            Evented.call(this);
            this._layers = [];
            this._animationFrameHandle = 0;

            this._context2d = document.createElement("canvas").getContext("2d");
            this._container = (typeof node === "string") ? document.getElementById(node) : node;
            this._container.appendChild(this._context2d.canvas);

            var self = this;
            this._handleAnimationFrame = function handleAnimationFrame() {
                self._animationFrameHandle = 0;
                for (var i = 0; i < self._layers.length; i += 1) {
                    self._layers[i].paint();
                }
            };

            window.addEventListener("resize", this.resize.bind(this));
        },

        addLayer: function (layer) {
            this._layers.push(layer);
            layer.on("invalidate", this.invalidate.bind(this));
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