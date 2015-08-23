define(["../../../bower_components/type/type", "Evented"], function (type, Evented) {


    return type(Object.prototype, Evented.prototype, {

        paint: function (context2d, transformation2d) {

        },

        invalidate: function () {
            this.emit("invalidate", this);
        }

    });


});