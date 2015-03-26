require.config({
    baseUrl: ".",
    paths: {
        'ponder': 'src',
        'type': "bower_components/type/type",
        'Promise': "bower_components/Promise/Promise",
        'Papa': "vendor/papaparse",
        '$': "bower_components/jquery/dist/jquery"
    },
    shim: {
        Papa: {
            exports: "Papa",
            init: function(){
                Papa.SCRIPT_PATH = "vendor/papaparse.js";
            }
        },
        $: {
            exports: "$"
        }
    }
});

require(["Papa", "$"], function (Papa, $) {


    console.log("args", arguments);

    document
        .getElementById("fileSelect")
        .addEventListener("change", function (event) {
            var file = event.target.files[0];
            if (!file) {
                return;
            }

            Papa.parse(file, {
                worker: true,
                header: true,
                complete: function (parsedObject) {
                    console.log("parsed!", parsedObject);
                },
                error: function () {
                    alert("cant parse file");
                }
            });

        }, false);


});