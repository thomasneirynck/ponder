define(["type", "jquery", "Evented"], function (type, $, Evented) {


    var mbr = {minx: 0, maxx: 0, miny: 0, maxy: 0};

    function isBetween(x, x1, x2) {
        return Math.min(x1, x2) <= x && x <= Math.max(x1, x2);
    }

    function ringContains(ring, x, y) {

        if (ring.length <= 3) {
            return false;
        }

        var contains, i, j;
        for (contains = false, i = -1, j = ring.length - 1; i < ring.length - 1; j = i) {
            i += 1;
            if (((ring[i].y <= y && y < ring[j].y) || (ring[j].y <= y && y < ring[i].y)) &&
                (x < (ring[j].x - ring[i].x) * (y - ring[i].y) / (ring[j].y - ring[i].y) + ring[i].x)
            ) {
                (contains = !contains);
            }
        }

        return contains;
    }

    return type(Object.prototype, Evented.prototype, {

        constructor: function AreaSelectLayerController() {
            this._linearRing = [];
        },

        _mbr: function (out) {

            out.minx = this._linearRing[0].x;
            out.miny = this._linearRing[0].y;
            out.maxx = this._linearRing[0].x;
            out.maxy = this._linearRing[0].y;

            for (var i = 1; i < this._linearRing.length; i += 1) {
                out.minx = Math.min(out.minx, this._linearRing[i].x);
                out.miny = Math.min(out.miny, this._linearRing[i].y);
                out.maxx = Math.max(out.maxx, this._linearRing[i].x);
                out.maxy = Math.max(out.maxy, this._linearRing[i].y);
            }
        },

        setOnMap: function (map) {

            if (this._map) {
                throw new Error("Cannot set controller on more than a single map");
            }
            this._map = map;
            this._map.addLayer(this);

            var self = this;

            this._downListener = this._map.on("dragstart", function (event) {
                self._linearRing.length = 0;
                self._linearRing.push({
                    x: self._map.toWorldX(event.getMapViewX()),
                    y: self._map.toWorldY(event.getMapViewY())
                });
                self.emit("invalidate");
            });

            this._moveListener = this._map.on("drag", function (event) {
                self._linearRing.push({
                    x: self._map.toWorldX(event.getMapViewX()),
                    y: self._map.toWorldY(event.getMapViewY())
                });
                self.emit("input", self._linearRing.slice());
                self.emit("invalidate");
            });

            this._outListener = this._map.on("dragend", function (event) {
                self._linearRing.push({
                    x: self._map.toWorldX(event.getMapViewX()),
                    y: self._map.toWorldY(event.getMapViewY())
                });
                self.emit("change", self._linearRing.slice());
                self.emit("invalidate");
            });

        },

        select: function (selection) {

            if (JSON.stringify(selection) === JSON.stringify(this._linearRing)) {
                return;
            }

            this._linearRing = selection;
            this.emit("invalidate");//redraw (should really fire new change event...)

        },

        removeFromMap: function () {
            this._map = null;
            this._moveListener.remove();
            this._downListener.remove();
            this._outListener.remove();
            this._upListener.remove();
        },


        isInsideSelectedWorldArea: function (x, y) {
            return ringContains(this._linearRing, x, y);
        },

        paint: function (context2d, map) {
            if (!this._linearRing.length) {
                return;
            }

            context2d.beginPath();
            context2d.moveTo(map.toViewX(this._linearRing[0].x, context2d), map.toViewY(this._linearRing[0].y, context2d));
            for (var i = 1; i < this._linearRing.length; i += 1) {
                context2d.lineTo(map.toViewX(this._linearRing[i].x, context2d), map.toViewY(this._linearRing[i].y, context2d));
            }
            context2d.closePath();
            context2d.strokeStyle = "rgb(240,240,240)";
            context2d.stroke();
            context2d.fillStyle = "rgba(210,210,210,0.8)";
            context2d.fill();

        }

    });


});