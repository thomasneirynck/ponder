define(["type", "jquery", "Evented"], function (type, $, Evented) {


    var mbr = {minx: 0, maxx: 0, miny: 0, maxy: 0};

    function isBetween(x, x1, x2){
        return Math.min(x1,x2) <= x && x <= Math.max(x1, x2);
    }
    return type(Object.prototype, Evented.prototype, {

        constructor: function (node) {

            this._linearRing = [];
            this._container = (typeof node === "string") ? document.getElementById(node) : node;

            var self = this;
            var down;
            $(this._container)
                .mousedown(function (event) {
                    down = true;
                    self._linearRing.length = 0;
                    self._linearRing.push({
                        x: event.offsetX,
                        y: event.offsetY
                    });
                })
                .mousemove(function (event) {
                    if (!down) {
                        return;
                    }
                    self._linearRing.push({
                        x: event.offsetX,
                        y: event.offsetY
                    });
                    self.emit("input", self);
                })
                .mouseup(function (event) {
                    self.emit("change", self);
                    down = false;
                })
                .mouseout(function (event) {
                    down = false;
                });
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

        isInsideSelectedArea: function (x, y) {
            if (!this._linearRing.length){
                return false;
            }
           return isBetween(x,this._linearRing[0].x, this._linearRing[this._linearRing.length -1].x) &&
                  isBetween(y,this._linearRing[0].y, this._linearRing[this._linearRing.length -1].y);
        },

        paint: function (context2d) {
            if (!this._linearRing.length) {
                return;
            }
            context2d.strokeRect(
                this._linearRing[0].x,
                this._linearRing[0].y,
                this._linearRing[this._linearRing.length - 1].x - this._linearRing[0].x,
                this._linearRing[this._linearRing.length - 1].y - this._linearRing[0].y
            );
        }

    });


});