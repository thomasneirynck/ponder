define(["type", "Evented", "./EasingInput", "./ColorMapper"], function (type, Evented, EasingInput, ColorMapper) {


    return type(Object.prototype, Evented.prototype, {

        constructor: function UMatrixTerrainLayer(easingInputNode) {
            this._easingInput = new EasingInput(easingInputNode);
            this._easingInput.on("input", this._refreshUMatrixViz.bind(this));
            this._colorMapper = new ColorMapper();
        },

        setUMatrixData: function (uMatrixData, width, height) {

            this._uMatrixData = uMatrixData;

            this._buffer = document.createElement("canvas").getContext("2d");
            this._buffer.canvas.width = width;
            this._buffer.canvas.height = height;
            this._bufferImageData = this._buffer.getImageData(0, 0, this._buffer.canvas.width, this._buffer.canvas.height);

            this._refreshUMatrixViz();

        },

        _refreshUMatrixViz: function () {

            if (!this._uMatrixData) {
                return;
            }

            this._colorMapper.setEasingParameters(this._easingInput.getA(), this._easingInput.getB());
            this._colorMapper.fillPixelBuffer(this._uMatrixData, this._bufferImageData);
            this._buffer.putImageData(this._bufferImageData, 0, 0);
            this.invalidate();
        },

        paint: function (context2d) {
            context2d.drawImage(this._buffer.canvas, 0, 0, context2d.canvas.width, context2d.canvas.height);
        },

        invalidate: function () {
            this.emit("invalidate", this);
        }

    });


});