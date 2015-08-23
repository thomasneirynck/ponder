define(["type", "Evented"], function (type, Evented) {


    return type(Object.prototype, Evented.prototype, {

        constructor: function Map() {
            Evented.call(this);


        },

        addLayer: function(){

        },

        invalidate: function(){
            
        }

    });


});