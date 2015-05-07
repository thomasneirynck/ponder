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
                return;
            }

            var command = this._queue.pop();
            if (!command) {
                return;
            }

            var self = this;

            function handle(event) {
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
            return this._doCommand({
                    type: "trainMap",
                    data: this._dataArray
                }
            );
        },
        uMatrix: function (bufferData) {
            return this._doCommand({
                type: "uMatrix",
                pixelBuffer: bufferData
            });
        },
        bmus: function () {
            return this._doCommand({
                type: "bmus",
                data: this._dataArray
            });
        },
        _doCommand: function (message) {
            this._queue.unshift({
                message: message,
                promise: new Promise()
            });
            this._schedule();
            return this._queue[0].promise;
        }


    });

});