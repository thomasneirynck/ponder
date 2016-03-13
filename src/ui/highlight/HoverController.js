define([
    "type",
    "Evented"
], function (type, Evented) {


    return type(Evented.prototype, {
        constructor: function () {
            Evented.call(this);
        },

        setOnMap: function (map) {

            var hadIdle = false;
            function select (mapEvent) {
                var itemsPerLayer = map.pick(mapEvent.getMapViewX(), mapEvent.getMapViewY());
                var all = document.createElement("div");
                var hasItems = false;
                itemsPerLayer.forEach(function (result) {
                    if (typeof result.layer.highlight === "function") {
                        result.layer.highlight(result.items);
                        result.items.map(function(itemId){
                            var html = result.layer.formatForItem(itemId);
                            all.appendChild(html);
                            hasItems = true;
                        }); }
                });


                if (hasItems && (hadIdle || map.hasBalloon())) {
                    map.showBalloon(mapEvent.getMapViewX(), mapEvent.getMapViewY(), all);
                }else{
                    map.hideBalloon();
                }
                hadIdle = false;
            }

            this._handle = map.on("idle", function(mapEvent){
                hadIdle = true;
                setTimeout(select.bind(null, mapEvent),0);
            });
            this._handle = map.on("move",select);

            function turnOff(layer){
                if (typeof layer.highlight === "function"){
                    layer.highlight(Array.prototype);
                }
            }

            this._outHandle = map.on("mouseout", function(){
                map.forEachLayer(turnOff);
                map.hideBalloon();
            });

        },

        removeFromMap: function (map) {
            this._handle.remove();
            this._outHandle.remove();
        }

    });


});