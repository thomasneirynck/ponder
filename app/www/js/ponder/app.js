require.config({
    baseUrl: /**{{BASE_URL}}*/"../.."/**{{BASE_URL}}*/,
    paths: {
        'demo': 'app/www/js/ponder',
        'ponder': 'src',
        'type': "bower_components/type/type",
        'Promise': "bower_components/Promise/Promise",
        'Evented': "bower_components/Evented/Evented",
        'Papa': /**{{PAPA_PARSE_MODULE_PATH}}*/"vendor/papaparse"/**{{PAPA_PARSE_MODULE_PATH}}*/,
        'jquery': "bower_components/jquery/dist/jquery",
        datatables: 'vendor/DataTables-1.10.7/media/js/jquery.dataTables',
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
    "demo/DataSelector",
    "ponder/ui/Map",
    "ponder/ui/umatrix/UMatrixTerrainLayer",
    "ponder/ui/bmu/BMULayer",
    "ponder/ui/areaselect/AreaSelectLayerController",
    "ponder/ui/highlight/HoverController",
    "ponder/ui/highlight/SelectController",
    "ponder/ui/bmu/BMUSelector",
    "ponder/ui/bmu/BMUSelectionHistory",
    "ponder/util",
    "ponder/appApi",
    "introJs",
    "jquery"
], function (DataSelector, Map, UMatrixTerrainLayer, BMULayer, AreaSelectLayerController, HoverController, SelectController, BMUSelector, BMUSelectionHistory, util, appApi, introJs, jquery) {


    console.log('creating som options', arguments);

    //----------------------------------
    //FUCKING UP!!!!
    var params = {
        somWorkerScriptPath: /**{{SOM_SCRIPT_PATH}}*/null/**{{SOM_SCRIPT_PATH}}*/,
        papaParseScriptPath: /**{{PAPA_PARSE_SCRIPT_PATH}}*/require.toUrl("Papa") + ".js"/**{{PAPA_PARSE_SCRIPT_PATH}}*/,
        container: document.body,
        mapTool: 'mapToolContainer',
        mapTableToggle: 'toggle'
    };
    var containerNode = typeof params.container === 'string' ? document.getElementById(params.container) : params.container;
    var mapToolNode = typeof params.mapTool === 'string' ? document.getElementById(params.mapTool) : params.mapTool;
    var mapTableToggleNode = typeof params.mapTableToggle === 'string' ? document.getElementById(params.mapTableToggle) : params.mapTableToggle;
    containerNode.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    });
    //----------------------------------


    var oldDisplayMapToolDisplay = mapToolNode.style.display;
    var oldDisplayToggleDisplay = mapTableToggleNode.style.display;

    var somHandle;


    Papa.SCRIPT_PATH = params.papaParseScriptPath;


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
        document.getElementById("uploadblurb").style.display = "none";
        document.getElementById("faq").style.display = "none";
    });


    dataSelector.on("change", function (dataTable) {

        dataSelector.destroy();
        jquery("#welcome").hide();


        //figure out title
        var title = util.getParameterByName("title") ? util.getParameterByName("title") : dataTable.getName();
        document.getElementById("title-blurb").innerHTML = title.toUpperCase();

        var somTrainingData = dataTable.createSOMTrainingData();

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


        appApi.createSOM({
            somTrainingData: somTrainingData,
            somWorkerScriptPath: params.somWorkerScriptPath
        })
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
            document.getElementById("mapToolContainer").style.display = oldDisplayMapToolDisplay;
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

            document.getElementById("toggle").style.display = oldDisplayToggleDisplay;

            waitingDiv.parentNode.removeChild(waitingDiv);
            document.getElementById("waiting").style.display = "none";
            document.getElementById("center").style.overflow = "auto";


            //bmus
            var bmuLayer = new BMULayer("label", "class", "size", "sizeEasing", "legend", dataTable, bmuResult.locations);
            map.addLayer(bmuLayer);

            var areaSelectLayerController = new AreaSelectLayerController();
            areaSelectLayerController.setOnMap(map);

            var bmuSelector = new BMUSelector(areaSelectLayerController, bmuLayer, somHandle, "table", "summary");
            bmuSelector.on("RowSelection", function (object) {
                bmuLayer.highlight([object.index]);
            });


            var bmuSelectionHistory = new BMUSelectionHistory("selectionHistory", bmuSelector, map, areaSelectLayerController.isActive.bind(areaSelectLayerController), [uMatrixLayer, areaSelectLayerController], "stripSelected");
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


