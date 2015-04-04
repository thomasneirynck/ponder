define(["type", "Promise"], function (type, Promise) {

    return type({

        constructor: function SOMHandle(somWorker, dataArray) {
            this._dataArray = dataArray;
            this._somWorker = somWorker;
            this._queue = [];
            this._busy = false;
        },
        _process: function () {

            if (this._busy) {
                console.log("busy, waiting");
                return;
            }

            var command = this._queue.pop();
            if (!command) {
                return;
            }

            var self = this;

            function handle(event) {
                console.log(event.data.type);
                command.promise.resolve(event.data);
                self._somWorker.removeEventListener("message", handle);
                self._busy = false;
                self._schedule();
            }

            this._busy = true;
            this._somWorker.addEventListener("message", handle);
            this._somWorker.postMessage(command.message);
        },

        _schedule: function () {
            setTimeout(this._process.bind(this), 0);
        },
        trainMap: function () {
            var p = new Promise();
            this._queue.unshift({
                message: {
                    type: "trainMap",
                    data: this._dataArray
                },
                promise: p
            });
            this._schedule();
            return p;
        },
        uMatrix: function (bufferData) {
            var p = new Promise();
            this._queue.unshift({
                message: {
                    type: "uMatrix",
                    pixelBuffer: bufferData
                },
                promise: p
            });
            this._schedule();
            return p;
        },
        bmus: function () {
            var p = new Promise();
            this._queue.unshift({
                message: {
                    type: "bmus",
                    data: this._dataArray
                },
                promise: p
            });
            this._schedule();
            return p;
        }


    });

});