require.config({
    baseUrl: ".",
    paths: {
        'ponder': 'src',
        'type': "bower_components/type/type",
        'Promise': "bower_components/Promise/Promise",
        'Papa': "vendor/papaparse"
    },
    shim: {
        Papa: {
            exports: "Papa"
        }
    }
});

require(["Papa"], function (Papa) {


    console.log("args", arguments);

});