define([
  "./som/SOMFactory",
  "./ui/Map",
  "./ui/umatrix/UMatrixTerrainLayer",
  "./ui/bmu/BMULayer",
  "./ui/areaselect/AreaSelectLayerController",
  "./ui/highlight/HoverController",
  "./ui/highlight/SelectController",
  "./ui/bmu/BMUSelector",
  "./ui/bmu/BMUSelectionHistory",
  "./util",
  "./appApi",
  "./dataload/DataTable",
  "jquery",
  "type",
  "Evented"
], function (SOMFactory, Map, UMatrixTerrainLayer, BMULayer, AreaSelectLayerController, HoverController, SelectController, BMUSelector, BMUSelectionHistory, util, appApi, DataTable, jquery, type, Evented) {


  function throwError(error) {
    console.error(error);
    console.error(error.stack);
    throw error;
  }


  var SomApp = type(Evented.prototype, {

    constructor: function (params) {

      var containerNode = getNode(params.nodes.container);
      var mapToolNode = getNode(params.nodes.toolbar);
      var mapTableToggleNode = getNode(params.nodes.mapTableToggle);

      containerNode.addEventListener("contextmenu", function (e) {
        e.preventDefault();
      });
      var oldDisplayMapToolDisplay = mapToolNode.style.display;
      var oldDisplayToggleDisplay = mapTableToggleNode.style.display;

      var tableContainer = getNode(params.nodes.table);
      var mapContainer = getNode(params.nodes.map);
      mapContainer.style.display = "none";
      tableContainer.style.display = "none";
      mapToolNode.style.display = "none";
      mapTableToggleNode.style.display = "none";

      var mapToggleButton = getNode(params.nodes.toggleToMap);
      var tableToggleButton = getNode(params.nodes.toggleToTable);


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


      var somHandle;

      //todo: remove the ponder/dataload/DataTable abstraction from ponder so this conversion step is not necessary
      //the correct data-API is ponder/Table
      var dataTable = DataTable.createDataTableFromTable(params.table);
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

      SOMFactory.SCRIPT_PATH = params.somWorkerScriptPath;
      return SOMFactory
      .makeSOMAsync(somTrainingData.dataArray, somTrainingData.codebookWeights)
      .then(function (aSomHandle) {
        somHandle = aSomHandle;
        return somHandle.trainMap();
      }, throwError)
      .then(function () {
        return somHandle.uMatrixNormalized();
      }, throwError, function onProgress(payload) {
        console.log('on porgress', arguments);
        //todo!!!! YOU HACKED THE PROMISE DEPENDENCY WHICH HAD A BUG!!!!!!! FIX IT!!!!
        waitingDivText.innerHTML = "Making map..." + Math.round(payload.progress * 100) + "%";
      })
      .then(function (successData) {

        jquery(mapContainer).show();
        mapToolNode.style.display = oldDisplayMapToolDisplay;
        mapContainer.style.display = "block";


        map = new Map("map", somHandle.width, somHandle.height);

        uMatrixLayer = new UMatrixTerrainLayer("ease", "easeReadout");
        uMatrixLayer.setUMatrixData(successData.uMatrix, somHandle.width, somHandle.height);
        map.addLayer(uMatrixLayer);

        waitingDivText.innerHTML = "Finding locations ...";
        getNode(params.nodes.center).appendChild(waitingDiv);


        return somHandle.bmus();
      }, throwError)
      .then(function (bmuResult) {

        mapTableToggleNode.style.display = oldDisplayToggleDisplay;

        waitingDiv.parentNode.removeChild(waitingDiv);
        getNode(params.nodes.waiting).style.display = "none";
        getNode(params.nodes.center).style.overflow = "auto";


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

    },

    destroy: function () {

    }

  });

  function getNode(node) {
    return typeof node === 'string' ? document.getElementById(node) : node;
  }

  /**
   * Public API to embed this app inside another web-app.
   * .. starting this so we can
   */
  return {
    createSOM: function (params) {
      return new SomApp(params);
    }

  };

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