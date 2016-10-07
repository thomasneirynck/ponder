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
  "jquery"
], function (SOMFactory, Map, UMatrixTerrainLayer, BMULayer, AreaSelectLayerController, HoverController, SelectController, BMUSelector, BMUSelectionHistory, util, appApi, jquery) {


  /**
   * Public API to embed this app inside another web-app.
   * .. starting this so we can
   */
  return {

    createSOM: function (params) {

      var somTrainingData = params.somTrainingData;

      SOMFactory.SCRIPT_PATH = params.somWorkerScriptPath;


      return SOMFactory.makeSOMAsync(somTrainingData.dataArray, somTrainingData.codebookWeights);




    }

  };



});