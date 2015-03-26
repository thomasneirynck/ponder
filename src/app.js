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

require(["Papa", "ponder/SOMFactory","ponder/colorRamp","$"], function (Papa, SOMFactory, colorRamp,$) {

    document
        .getElementById("fileSelect")
        .addEventListener("change", function (event) {
            var file = event.target.files[0];
            if (!file) {
                return;
            }

            Papa.parse(file, {
                worker: true,
                complete: createSom,
                error: function () {
                    alert("cant parse file");
                }
            });

        }, false);


    function createSom(parsedResult){

        var context2d = document.getElementById("som").getContext("2d");
        context2d.canvas.width = $(context2d.canvas).parent().width();
        context2d.canvas.height = $(context2d.canvas).parent().height();

        var som = SOMFactory.makeSOM(parsedResult.data, context2d);


    }


});