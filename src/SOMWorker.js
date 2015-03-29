importScripts("../../bower_components/requirejs/require.js");

require(["ponder/SOM"], function (SOM) {

    var som;

    onmessage(function (event) {

        if (event.data.type === "init"){
           som = new SOM();

        } else if (event.data.type === "umatrix"){

        }

    });


});