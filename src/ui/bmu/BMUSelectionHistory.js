define([
    "type"
], function (type) {


    return type({


        constructor: function BMUSelectionHistory(node, bmuSelector) {


            this._selections = [];
            this._node = typeof node === "string" ? document.getElementById(node) : node;

            var self = this;
            bmuSelector.on("change", function (event) {
                self._selections.push(event);
                var areaSelection = document.createElement("div");
                areaSelection.innerHTML = JSON.stringify(event.selectedIndices);
                self._node.appendChild(areaSelection);
            });


        }


    });


});