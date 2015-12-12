define([
    "type",
    "Evented"
], function (type, Evented) {


    return type(Evented.prototype, {

        constructor: function CategoryLegend(classElement, legendDiv) {

            Evented.call(this);
            this._classInputSelect = classElement;
            this._legendDiv = legendDiv;

            this._classElement.addEventListener("change", function(){
               console.log("class thingie changed");
            });

        }




    });

});