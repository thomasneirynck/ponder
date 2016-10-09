require.config({
  baseUrl: /**{{BASE_URL}}*/"../.."/**{{BASE_URL}}*/,
  paths: {
    'demo': 'app/www/js/ponder',
    'ponder': 'src',
    'api': 'api',
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


define(["api/api"], function(api){
  //loads the ponder API; todo remove
});