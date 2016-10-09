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
  "./Table",
  "jquery",
  "type",
  "Evented"
], function (SOMFactory, Map, UMatrixTerrainLayer, BMULayer, AreaSelectLayerController, HoverController, SelectController, BMUSelector, BMUSelectionHistory, util, appApi, DataTable, Table, jquery, type, Evented) {


  function throwError(error) {
    console.error(error);
    console.error(error.stack);
    throw error;
  }


  var SomApp = type(Evented.prototype, {

    constructor: function (params) {

      Evented.call(this);

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


      var self = this;
      self._somHandle = null;

      //todo: remove the ponder/dataload/DataTable abstraction from ponder so this conversion step is not necessary
      //the correct data-API is ponder/Table
      var dataTable = DataTable.createDataTableFromTable(params.table);
      var somTrainingData = dataTable.createSOMTrainingData();

      self._map = null;
      var uMatrixLayer;


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

      SOMFactory
      .makeSOMAsync(somTrainingData.dataArray, somTrainingData.codebookWeights)
      .then(function (aSomHandle) {
        self._somHandle = aSomHandle;
        return self._somHandle.trainMap();
      }, throwError)
      .then(function () {
        return self._somHandle.uMatrixNormalized();
      }, throwError, function onProgress(payload) {
        console.log('on porgress', arguments);
        //todo!!!! YOU HACKED THE PROMISE DEPENDENCY WHICH HAD A BUG!!!!!!! FIX IT!!!!
        waitingDivText.innerHTML = "Making map..." + Math.round(payload.progress * 100) + "%";
      })
      .then(function (successData) {

        jquery(mapContainer).show();
        mapToolNode.style.display = oldDisplayMapToolDisplay;
        mapContainer.style.display = "block";

        self._map = new Map("map", self._somHandle.width, self._somHandle.height);

        uMatrixLayer = new UMatrixTerrainLayer("ease", "easeReadout");
        uMatrixLayer.setUMatrixData(successData.uMatrix, self._somHandle.width, self._somHandle.height);
        self._map.addLayer(uMatrixLayer);

        waitingDivText.innerHTML = "Finding locations ...";
        getNode(params.nodes.center).appendChild(waitingDiv);


        return self._somHandle.bmus();
      }, throwError)
      .then(function (bmuResult) {

        mapTableToggleNode.style.display = oldDisplayToggleDisplay;

        waitingDiv.parentNode.removeChild(waitingDiv);
        getNode(params.nodes.waiting).style.display = "none";
        getNode(params.nodes.center).style.overflow = "auto";


        //bmus
        var bmuLayer = new BMULayer("label", "class", "size", "sizeEasing", "legend", dataTable, bmuResult.locations, params.bmu.initialColumn);
        self._map.addLayer(bmuLayer);

        var areaSelectLayerController = new AreaSelectLayerController();
        areaSelectLayerController.setOnMap(self._map);

        var bmuSelector = new BMUSelector(areaSelectLayerController, bmuLayer, self._somHandle, "table", "summary");
        bmuSelector.on("RowSelection", function (object) {
          bmuLayer.highlight([object.index]);
        });


        var bmuSelectionHistory = new BMUSelectionHistory("selectionHistory", bmuSelector, self._map, areaSelectLayerController.isActive.bind(areaSelectLayerController), [uMatrixLayer, areaSelectLayerController], "stripSelected");
        bmuSelector.selectAll();


        var hoverController = new HoverController();
        hoverController.setOnMap(self._map);

        var selectController = new SelectController();
        selectController.setOnMap(self._map);


      }, throwError)
      .then(function () {
        self.emit("AppLoaded");
      })
      .then(Function.prototype, throwError);

    },

    destroy: function () {
      if (this._somHandle) {
        this._somHandle.kill();
        this._somHandle = null;
        if (this._map) {
          this._map.destroy();
        }
        this._map = null;
      }

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
    },

    Table: Table,

    /**
     * this is the toNumber function used by Ponder.
     * Use this when you want to e.g. show previews of data.
     */
    toNumber: util.toNumber

  };


});