define(["Promise","SOM"], function (Promise, SOM) {


    return {

        makeSOM: function (trainingData) {

            var somWorker = new Worker("./SOMWorker.js");

            var item;
            var mins = [];
            var max = [];
            for (var i = 0; i < trainingData.length; i += 1) {
                for (var i = 0; i < trainingData[i].length; i += 1) {

                }
            }

            var dataArray = [];

            var ret = new Promise();


            return ret.then(function () {
                somWorker.terminate();
            });

        }

    };


});