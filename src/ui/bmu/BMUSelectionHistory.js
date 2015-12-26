define([
    "type"
], function (type) {


    return type({


        constructor: function BMUSelectionHistory(node, bmuSelector) {


            this._selections = [];
            this._node = typeof node === "string" ? document.getElementById(node) : node;

            var self = this;
            bmuSelector.on("change", function (selectionEvent) {

                self._selections.push(selectionEvent);

                var areaSelectionNode = document.createElement("div");
                areaSelectionNode.innerHTML = JSON.stringify(selectionEvent.selectedIndices);

                self._node.insertBefore(areaSelectionNode, self._node.firstChild);

                areaSelectionNode.addEventListener("click", function () {

                    self._node.removeChild(areaSelectionNode);
                    self._node.insertBefore(areaSelectionNode, self._node.firstChild);

                    self._selections.splice(self._selections.indexOf(selectionEvent), 1);
                    self._selections.push(selectionEvent);

                    bmuSelector.select(selectionEvent);

                });

            });


        }


    });


});