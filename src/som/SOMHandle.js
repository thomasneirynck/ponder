define(["type", "Promise", "./Statistics"], function (type, Promise, Statistics) {

    return type({

        constructor: function SOMHandle(somWorker) {
            this._somWorker = somWorker;
            this._queue = [];
            this._pendingCommand = null;
            this._width = -1;
            this._height = -1;
        },

        setDataArray: function (dataArray) {
            this._dataArray = dataArray;
        },

        setWidthHeight: function (width, height) {
            this._width = width;
            this._height = height;
        },

        getWidth: function () {
            return this._width;
        },

        getHeight: function () {
            return this._height;
        },


        kill: function () {
            this._somWorker.terminate();
            if (this._pendingCommand) {
                this._pendingCommand.promise.reject();
            }
            var command = this._queue.pop();
            while (command) {
                command.reject();
                command = this._queue.pop();
            }
        },

        _process: function () {

            if (this._pendingCommand || !this._queue.length) {
                return;
            }

            var self = this;
            this._pendingCommand = this._queue.pop();

            function handleMessage(event) {
                if (self._pendingCommand.progress === event.data.type) {
                    self._pendingCommand.promise.progress(event.data);
                } else if (typeof self._pendingCommand.success === "undefined" || self._pendingCommand.success === event.data.type) {
                    self._pendingCommand.promise.resolve(event.data);
                    stopListeningAndScheduleNext();
                } else if (self._pendingCommand.error === event.data.type) {
                    self._pendingCommand.promise.reject(event.data);
                    stopListeningAndScheduleNext();
                }
            }

            function stopListeningAndScheduleNext(){
                self._somWorker.removeEventListener("message", handleMessage);
                self._pendingCommand = null;
                self._schedule();
            }

            this._somWorker.addEventListener("message", handleMessage);
            this._somWorker.postMessage(this._pendingCommand.message);
        },

        _schedule: function () {
            setTimeout(this._process.bind(this), 0);
        },

        dumpToJson: function () {
            return this._doCommand({type: "dumpToJson"}, "dumpToJsonSuccess", undefined);
        },


        trainMap: function () {
            return this._doCommand({
                    type: "trainMap",
                    data: this._dataArray
                }, "trainMapSuccess", "trainMapProgress", undefined
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

        _doCommand: function (message, successMessageName, progressMessageName, errorMessageName) {
            this._queue.unshift({
                message: message,
                promise: new Promise(),
                success: successMessageName,
                progress: progressMessageName,
                error: errorMessageName
            });
            this._schedule();
            return this._queue[0].promise;
        }


    });

});