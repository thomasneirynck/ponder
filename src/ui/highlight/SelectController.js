define([
    "type",
    "Evented"
], function (type, Evented) {


    return type(Evented.prototype, {
        constructor: function SelectController() {
            Evented.call(this);
        },

        setOnMap: function (map) {

            function collectItems(accumulator, result) {
                return accumulator.concat(result.items);
            }

            function select (mapEvent) {
                var itemsPerLayer = map.pick(mapEvent.getMapViewX(), mapEvent.getMapViewY());
                var all = itemsPerLayer.reduce(collectItems, []);
            }

            this._handle = map.on("click",select);

            function turnOff(layer){
                if (typeof layer.highlight === "function"){
                    layer.highlight(Array.prototype);
                }
            }

            this._outHandle = map.on("mouseout", function(){
                map.forEachLayer(turnOff);
            });

        },

        removeFromMap: function (map) {
            this._handle.remove();
            this._outHandle.remove();
        }

    });


});