define([
    "type",
    "Evented"
], function (type, Evented) {


    return type(Evented.prototype, {
        constructor: function () {
            Evented.call(this);
        },

        setOnMap: function (map) {
            this._handle = map.on("move", function (mapEvent) {
                var itemsPerLayer = map.pick(mapEvent.getMapViewX(), mapEvent.getMapViewY());
                itemsPerLayer.forEach(function (result) {
                    if (typeof result.layer.highlight === "function") {
                        result.layer.highlight(result.items);
                    }
                });
            });
        },

        removeFromMap: function (map) {
            this._handle.remove();
        }

    });


});