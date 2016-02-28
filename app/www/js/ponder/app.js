require.config({
    baseUrl: /**{{BASE_URL}}*/"../.."/**{{BASE_URL}}*/,
    paths: {
        'ponder': 'src',
        'type': "bower_components/type/type",
        'Promise': "bower_components/Promise/Promise",
        'Evented': "bower_components/Evented/Evented",
        'Papa': /**{{PAPA_PARSE_MODULE_PATH}}*/"vendor/papaparse"/**{{PAPA_PARSE_MODULE_PATH}}*/,
        'jquery': "bower_components/jquery/dist/jquery",
        datatables: 'bower_components/datatables/media/js/jquery.dataTables',
        datatables_colvis: 'vendor/DataTables-1.10.7/extensions/ColVis/js/dataTables.colVis',
        //plotly: "vendor/plotly_20150812a_basic/plotly.min",
        //plotly: "vendor/plotly/plotly-latest.min",
        //plotly: "vendor/plotly/plotly.min",
        plotly: "vendor/plotly/plotly",
        typedarray: "vendor/plotly_20150812a_basic/dependencies/typedarray",
        d3: "vendor/plotly_20150812a_basic/dependencies/d3.v3.min",
        jStat: "vendor/jstat"
    },
    shim: {
        Papa: {
            exports: "Papa"
        },
        jquery: {
            exports: "jquery"
        },
        plotly: {
            exports: "Plotly",
            deps: ["d3", "jquery", "typedarray"]
        },
        d3: {
            exports: "d3"
        },
        jStat: {
            exports: "jStat"
        }
    }
});

Plotly = this.Plotly || {};//plotly makes baby-jesus cry by not being compatible with requirejs.(https://github.com/plotly/plotly.github.io/issues/74)
require([
    "ponder/som/SOMFactory",
    "ponder/dataload/DataSelector",
    "ponder/ui/Map",
    "ponder/ui/umatrix/UMatrixTerrainLayer",
    "ponder/ui/bmu/BMULayer",
    "ponder/ui/areaselect/AreaSelectLayerController",
    "ponder/ui/highlight/HoverController",
    "ponder/ui/bmu/BMUSelector",
    "ponder/ui/bmu/BMUSelectionHistory",
    "jquery"
], function (SOMFactory, DataSelector, Map, UMatrixTerrainLayer, BMULayer, AreaSelectLayerController, HoverController,BMUSelector, BMUSelectionHistory, jquery) {

    document.body.addEventListener("contextmenu",function (e) {
        e.preventDefault();
    });

    jquery("#map").hide();
    var oldDisplay = document.getElementById("mapToolContainer").style.display;
    document.getElementById("mapToolContainer").style.display = "none";
    var somHandle;

    SOMFactory.SCRIPT_PATH = /**{{SOM_SCRIPT_PATH}}*/null/**{{SOM_SCRIPT_PATH}}*/;
    Papa.SCRIPT_PATH = /**{{PAPA_PARSE_SCRIPT_PATH}}*/require.toUrl("Papa") + ".js"/**{{PAPA_PARSE_SCRIPT_PATH}}*/;


    function throwError(error) {
        console.error(error);
        console.error(error.stack);
        throw error;
    }


    jquery("#map").hide();
    document.getElementById("mapToolContainer").style.display = "none";


    var tableContainer = document.getElementById("tableContainer");
    var mapContainer = document.getElementById("map");
    tableContainer.style.display = "none";

    var mapToggleButton = document.getElementById("toggle-to-map");
    var tableToggleButton = document.getElementById("toggle-to-table");


    function selectMapOrTable(event) {
        if (event.target === mapToggleButton) {
            tableToggleButton.classList.remove("selectedToggle");
            tableContainer.style.display = "none";
            mapToggleButton.classList.add("selectedToggle");
            mapContainer.style.display = "block";
            mapContainer.style.height = "100%";

        } else {
            mapToggleButton.classList.remove("selectedToggle");
            mapContainer.style.display = "none";
            mapContainer.style.height = "auto";
            tableToggleButton.classList.add("selectedToggle");
            tableContainer.style.display = "block";
        }
    }

    mapToggleButton.addEventListener("click", selectMapOrTable);
    tableToggleButton.addEventListener("click", selectMapOrTable);

    var dataSelector = new DataSelector("selector", "tablePreview");
    dataSelector.on("error", function () {
        alert("Cannot read table");
    });

    dataSelector.on("tableLoaded", function(){
       document.getElementById("blurb").style.display = "none";
    });


    dataSelector.on("change", function (table) {

        dataSelector.destroy();
        jquery("#welcome").hide();

        var somTrainingData = table.createSOMTrainingData();

        var map, uMatrixLayer;
        if (somHandle) {
            somHandle.kill();
            somHandle = null;
            if (map) {
                map.destroy();
            }
            map = null;
        }

        var waitingDiv = document.createElement("div");
        var spinnerIcon = document.createElement("img");
        spinnerIcon.src = "images/ajax-loader.gif";
        waitingDiv.appendChild(spinnerIcon);
        var waitingDivText = document.createElement("span");
        waitingDivText.innerHTML  = "Thinking ... 0%";
        waitingDiv.appendChild(waitingDivText);
        document.getElementById("center").appendChild(waitingDiv);
        SOMFactory
            .makeSOMAsync(somTrainingData.dataArray, somTrainingData.codebookWeights)
            .then(function (aSomHandle) {
                somHandle = aSomHandle;
                return somHandle.trainMap();
            }, throwError)
            .then(function () {
                return somHandle.uMatrixNormalized();
            }, throwError, function(payload){
                //todo!!!! YOU HACKED THE PROMISE DEPENDENCY WHICH HAD A BUG!!!!!!! FIX IT!!!!
                waitingDivText.innerHTML = "Thinking ..." + Math.round(payload.progress * 100) + "%";
            })
            .then(function (successData) {

                jquery("#map").show();
                document.getElementById("mapToolContainer").style.display = oldDisplay;

                waitingDiv.parentNode.removeChild(waitingDiv);
                map = new Map("map", somHandle.width, somHandle.height);


                uMatrixLayer = new UMatrixTerrainLayer("ease", "easeReadout");
                uMatrixLayer.setUMatrixData(successData.uMatrix, somHandle.width, somHandle.height);
                map.addLayer(uMatrixLayer);
                return somHandle.bmus();
            }, throwError)
            .then(function (bmuResult) {

                //bmus
                var bmuLayer = new BMULayer("label", "class", "size", "sizeEasing", "legend", table, bmuResult.locations);
                map.addLayer(bmuLayer);

                var areaSelectLayerController = new AreaSelectLayerController();
                areaSelectLayerController.setOnMap(map);

                var bmuSelector = new BMUSelector(areaSelectLayerController, bmuLayer, somHandle, "table", "summary");


                new BMUSelectionHistory("selectionHistory", bmuSelector, map, areaSelectLayerController.isActive.bind(areaSelectLayerController), [uMatrixLayer, areaSelectLayerController], "stripSelected");

                bmuSelector.selectAll();

                var hoverController = new HoverController();
                hoverController.setOnMap(map);



            }, throwError)
            .then(Function.prototype, throwError);
    });


});


