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
                var res = map.pick(mapEvent.getMapViewX(), mapEvent.getMapViewY());
                res.forEach(function (result) {
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