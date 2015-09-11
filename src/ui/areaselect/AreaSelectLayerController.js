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

            var down;
            this._downListener = this._map.on("mousedown", function (event) {
                down = true;
                self._linearRing.length = 0;
                self._linearRing.push({
                    x: self._map.toWorldX(event.offsetX),
                    y: self._map.toWorldY(event.offsetY)
                });
                self.emit("invalidate");
            });

            this._moveListener = this._map.on("mousemove", function (event) {
                if (!down) {
                    return;
                }
                self._linearRing.push({
                    x: self._map.toWorldX(event.offsetX),
                    y: self._map.toWorldY(event.offsetY)
                });
                self.emit("input", self);
                self.emit("invalidate");
            });

            this._outListener = this._map.on("mouseout", function (event) {
                if (!down) {
                    return;
                }
                self._linearRing.push({
                    x: self._map.toWorldX(event.offsetX),
                    y: self._map.toWorldY(event.offsetY)
                });
                self.emit("input", self);
                self.emit("invalidate");
            });


            this._upListener = this._map.on("window_mouseup", function (event) {
                down = false;
                self.emit("change", self);
                self.emit("invalidate", self);
            });

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
            context2d.moveTo(map.toViewX(this._linearRing[0].x), map.toViewY(this._linearRing[0].y));
            for (var i = 1; i < this._linearRing.length; i += 1) {
                context2d.lineTo(map.toViewX(this._linearRing[i].x), map.toViewY(this._linearRing[i].y));
            }
            context2d.closePath();
            context2d.strokeStyle = "rgb(0,0,0)";
            context2d.stroke();
            context2d.fillStyle = "rgba(200,200,200,0.7)";
            context2d.fill();

        }

    });


});