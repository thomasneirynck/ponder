define(["type", "Promise", "./Statistics"], function (type, Promise, Statistics) {

    console.log("blarf!");

    return type({

        constructor: function SOMHandle(somWorker, dataArray) {
            this._dataArray = dataArray;
            this._somWorker = somWorker;
            this._queue = [];
            this._busy = false;
        },

        kill: function () {
            this._somWorker.terminate();
        },

        _process: function () {

            if (this._busy || !this._queue.length) {
                return;
            }

            var self = this;

            var command = this._queue.pop();

            this._busy = true;
            this._somWorker.addEventListener("message", function handleMessage(event) {
                command.promise.resolve(event.data);
                self._somWorker.removeEventListener("message", handleMessage);
                self._busy = false;
                self._schedule();
            });
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
        uMatrixNormalized: function () {
            return this._doCommand({
                type: "uMatrixNormalized"
            });
        },
        interpolate: function (values, width, height) {
            return this._doCommand({
                type: "interpolate",
                values: values,
                targetWidth: width,
                targetHeight: height
            });
        },
        bmus: function () {
            return this._doCommand({
                type: "bmus",
                data: this._dataArray
            });
        },

        statistics: function (indices) {
            var self = this;
            return this._doCommand({
                type: "statistics",
                indices: indices
            }).then(function (result) {
                return new Statistics(result.statistics, self._dataArray, indices);
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