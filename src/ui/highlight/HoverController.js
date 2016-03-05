define([
    "type",
    "Evented"
], function (type, Evented) {


    return type(Evented.prototype, {
        constructor: function () {
            Evented.call(this);
        },

        setOnMap: function (map) {

            function select (mapEvent) {
                var itemsPerLayer = map.pick(mapEvent.getMapViewX(), mapEvent.getMapViewY());
                itemsPerLayer.forEach(function (result) {
                    if (typeof result.layer.highlight === "function") {
                        result.layer.highlight(result.items);
                    }
                });
            }

            this._handle = map.on("move",select);

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