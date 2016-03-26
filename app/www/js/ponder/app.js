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
        jStat: "vendor/jstat",
        introJs: "vendor/intro.js-2.0.0/minified/intro.min"
    },
    shim: {
        Papa: {
            exports: "Papa"
        },
        jquery: {
            exports: "jquery"
        },
        jStat: {
            exports: "jStat"
        },
        "introJs": {
            exports: "introJs"
        }
    }
});


require([
    "ponder/som/SOMFactory",
    "ponder/dataload/DataSelector",
    "ponder/ui/Map",
    "ponder/ui/umatrix/UMatrixTerrainLayer",
    "ponder/ui/bmu/BMULayer",
    "ponder/ui/areaselect/AreaSelectLayerController",
    "ponder/ui/highlight/HoverController",
    "ponder/ui/highlight/SelectController",
    "ponder/ui/bmu/BMUSelector",
    "ponder/ui/bmu/BMUSelectionHistory",
    "introJs",
    "jquery"
], function (SOMFactory, DataSelector, Map, UMatrixTerrainLayer, BMULayer, AreaSelectLayerController, HoverController, SelectController, BMUSelector, BMUSelectionHistory, introJs, jquery) {


    document.body.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    });


    var oldDisplayMapTool = document.getElementById("mapToolContainer").style.display;
    var oldDisplayToggle = document.getElementById("toggle").style.display;

    var somHandle;

    SOMFactory.SCRIPT_PATH = /**{{SOM_SCRIPT_PATH}}*/null/**{{SOM_SCRIPT_PATH}}*/;
    Papa.SCRIPT_PATH = /**{{PAPA_PARSE_SCRIPT_PATH}}*/require.toUrl("Papa") + ".js"/**{{PAPA_PARSE_SCRIPT_PATH}}*/;


    function throwError(error) {
        console.error(error);
        console.error(error.stack);
        throw error;
    }


    var tableContainer = document.getElementById("tableContainer");
    var mapContainer = document.getElementById("map");
    mapContainer.style.display = "none";
    tableContainer.style.display = "none";
    document.getElementById("mapToolContainer").style.display = "none";
    document.getElementById("toggle").style.display = "none";


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
            mapContainer.style.height = "100%";
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

    dataSelector.on("tableLoaded", function () {
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
        waitingDiv.setAttribute("data-ponder-type", "progress_indicator");
        var spinnerIcon = document.createElement("img");
        spinnerIcon.src = "images/ajax-loader.gif";
        waitingDiv.appendChild(spinnerIcon);
        var waitingDivText = document.createElement("span");
        waitingDivText.innerHTML = "Estimating progress...";
        waitingDiv.appendChild(waitingDivText);
        document.getElementById("waiting").appendChild(waitingDiv);



        SOMFactory
            .makeSOMAsync(somTrainingData.dataArray, somTrainingData.codebookWeights)
            .then(function (aSomHandle) {
                somHandle = aSomHandle;
                return somHandle.trainMap();
            }, throwError)
            .then(function () {
                return somHandle.uMatrixNormalized();
            }, throwError, function (payload) {
                //todo!!!! YOU HACKED THE PROMISE DEPENDENCY WHICH HAD A BUG!!!!!!! FIX IT!!!!
                waitingDivText.innerHTML = "Making map..." + Math.round(payload.progress * 100) + "%";
            })
            .then(function (successData) {

                jquery("#map").show();
                document.getElementById("mapToolContainer").style.display = oldDisplayMapTool;
                mapContainer.style.display = "block";


                map = new Map("map", somHandle.width, somHandle.height);


                uMatrixLayer = new UMatrixTerrainLayer("ease", "easeReadout");
                uMatrixLayer.setUMatrixData(successData.uMatrix, somHandle.width, somHandle.height);
                map.addLayer(uMatrixLayer);

                waitingDivText.innerHTML = "Finding locations ...";
                document.getElementById("center").appendChild(waitingDiv);


                return somHandle.bmus();
            }, throwError)
            .then(function (bmuResult) {

                document.getElementById("toggle").style.display = oldDisplayToggle;

                waitingDiv.parentNode.removeChild(waitingDiv);
                document.getElementById("waiting").style.display = "none";
                document.getElementById("center").style.overflow = "auto";


                //bmus
                var bmuLayer = new BMULayer("label", "class", "size", "sizeEasing", "legend", table, bmuResult.locations);
                map.addLayer(bmuLayer);

                var areaSelectLayerController = new AreaSelectLayerController();
                areaSelectLayerController.setOnMap(map);

                var bmuSelector = new BMUSelector(areaSelectLayerController, bmuLayer, somHandle, "table", "summary");
                bmuSelector.on("RowSelection", function (object) {
                    bmuLayer.highlight([object.index]);
                });


                new BMUSelectionHistory("selectionHistory", bmuSelector, map, areaSelectLayerController.isActive.bind(areaSelectLayerController), [uMatrixLayer, areaSelectLayerController], "stripSelected");
                bmuSelector.selectAll();

                var hoverController = new HoverController();
                hoverController.setOnMap(map);

                var selectController = new SelectController();
                selectController.setOnMap(map);


            }, throwError)
            .then(function () {

                //start intro
                if (getCookie("ponder-intro") === "1") {
                    return;
                }

                var intro = introJs();
                setCookie("ponder-intro", "1", 100);
                intro.start();


            })
            .then(Function.prototype, throwError);
    });

    function setCookie(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
    }

    function getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }

            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }

        }
        return "";
    }


});


