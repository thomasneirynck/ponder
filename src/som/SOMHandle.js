define(["type", "Promise", "./Statistics"], function (type, Promise, Statistics) {

    return type({

        constructor: function SOMHandle(somWorker, dataArray, width, height) {
            this._dataArray = dataArray;
            this._somWorker = somWorker;
            this._queue = [];
            this._pendingCommand = null;
            this.width = width;
            this.height = height;
        },

        kill: function () {
            this._somWorker.terminate();
            this._pendingCommand && this._pendingCommand.promise.reject();
            var command;
            while (command = this._queue.pop()) {
                command.reject();
            }
        },

        _process: function () {

            if (this._pendingCommand || !this._queue.length) {
                return;
            }

            var self = this;
            this._pendingCommand = this._queue.pop();
            this._somWorker.addEventListener("message", function handleMessage(event) {
                self._pendingCommand.promise.resolve(event.data);
                self._somWorker.removeEventListener("message", handleMessage);
                self._pendingCommand = null;
                self._schedule();
            });
            this._somWorker.postMessage(this._pendingCommand.message);
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