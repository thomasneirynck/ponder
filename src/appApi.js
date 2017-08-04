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
  "Evented",
  "datatables"
], function (SOMFactory, Map, UMatrixTerrainLayer, BMULayer, AreaSelectLayerController, HoverController, SelectController, BMUSelector, BMUSelectionHistory, util, appApi, DataTable, Table, jquery, type, Evented, datatables) {


  function throwError(error) {
    console.error(error);
    console.error(error.stack);
    throw error;
  }


  var AbstractSomMap = type(Evented.prototype, {

    constructor: function (params) {

      Evented.call(this);

      this._somHandle = null;
      this._map = null;

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

      var waitingDiv = document.createElement("div");
      waitingDiv.setAttribute("data-ponder-type", "progress_indicator");
      var spinnerIcon = document.createElement("img");
      // spinnerIcon.src = "images/ajax-loader.gif";
      spinnerIcon.src = "data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH+GkNyZWF0ZWQgd2l0aCBhamF4bG9hZC5pbmZvACH5BAAKAAAAIf8LTkVUU0NBUEUyLjADAQAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQACgABACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkEAAoAAgAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkEAAoAAwAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkEAAoABAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQACgAFACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQACgAGACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAAKAAcALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA==";
      waitingDiv.appendChild(spinnerIcon);
      var waitingDivText = document.createElement("span");
      waitingDivText.innerHTML = "Estimating progress...";
      waitingDiv.appendChild(waitingDivText);
      getNode(params.nodes.waiting).appendChild(waitingDiv);


      //todo: remove the ponder/dataload/DataTable abstraction from ponder so this conversion step is not necessary
      //the correct data-API is ponder/Table
      var dataTable = this.getDataTable(params.table);
      this._dataTable = dataTable;
      var somTrainingData = dataTable.createSOMTrainingData();

      var uMatrixLayer;
      var self = this;
      SOMFactory.SCRIPT_PATH = params.somWorkerScriptPath;
      this.getSomHandleWithTrainedMap({somTrainingData: somTrainingData})
      .then(function (somHandle) {
        self._somHandle = somHandle;
      })
      .then(function () {
        return self._somHandle.uMatrixNormalized();
      }, throwError, function onProgress(payload) {
        //todo!!!! YOU HACKED THE PROMISE DEPENDENCY WHICH HAD A BUG!!!!!!! PUSH IT TO REPO!!!!
        waitingDivText.innerHTML = "Making map..." + Math.round(payload.progress * 100) + "%";
      })
      .then(function (successData) {

        jquery(mapContainer).show();
        mapToolNode.style.display = oldDisplayMapToolDisplay;
        mapContainer.style.display = "block";

        self._map = new Map("map", self._somHandle.getWidth(), self._somHandle.getHeight());

        uMatrixLayer = new UMatrixTerrainLayer("ease", "easeReadout");
        uMatrixLayer.setUMatrixData(successData.uMatrix, self._somHandle.getWidth(), self._somHandle.getHeight());
        self._map.addLayer(uMatrixLayer);

        waitingDivText.innerHTML = "Finding locations ...";
        getNode(params.nodes.center).appendChild(waitingDiv);

        return self._somHandle.bmus();
      }, throwError)
      .then(function (bmuResult) {


        console.log('bmu result', bmuResult);

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

        bmuSelector.on('selectionChanged', function (event) {
          self.emit('bmuSelection:changed', event);
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

    dumpApp: function(){
      var self = this;
      return this._somHandle.dumpToJson().then(function(e){
        return {
          som: e.json,
          tableStructure: self._dataTable.dumpStructureToJson()
        };
      });
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

    },

    fit: function () {
      if (this._map) {
        this._map.resize();
      }
    },

    getDataTable: function (dataTable) {
      throw new Error('child must imeplement');
    },



    getSomHandleWithTrainedMap: function () {
      throw new Error('child must imeplement');
    }

  });


  var SomAppFromData = type(AbstractSomMap.prototype, {

    constructor: function () {
      AbstractSomMap.apply(this, arguments);
    },

    getDataTable: function (table) {
      return new DataTable(table);
    },

    getSomHandleWithTrainedMap: function (options) {
      var somHandle;
      return SOMFactory
      .makeSOMAsync(options.somTrainingData.dataArray, options.somTrainingData.codebookWeights)
      .then(function (aSomHandle) {
        somHandle = aSomHandle;
        return aSomHandle.trainMap();
      }, throwError)
      .then(function () {
        return somHandle;
      });
    }

  });


  var SomAppFromConfig = type(AbstractSomMap.prototype, {

    constructor: function (jsonDump, tableStructure, params) {
      this._jsonDump = jsonDump;
      this._tableStructure = tableStructure;
      AbstractSomMap.call(this, params);
    },

    getDataTable: function (table) {
      var table = new DataTable(table);
      table.overrideStructureFromJson(this._tableStructure);
      return table;
    },


    getSomHandleWithTrainedMap: function (options) {
      return SOMFactory.makeSOMFromJsonDump(options.somTrainingData.dataArray, this._jsonDump);
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

    createSOMFromJson: function (appDump, params) {
      return new SomAppFromConfig(appDump.som, appDump.tableStructure, params);
    },

    createSOM: function (params) {
      return new SomAppFromData(params);
    },

    Table: Table,

    /**
     * this is the toNumber function used by Ponder.
     * Use this when you want to e.g. show previews of data.
     */
    toNumber: util.toNumber

  };


});