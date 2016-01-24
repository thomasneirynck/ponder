define([
    "type",
    "jquery"
], function (type, jquery) {


    return type({


        constructor: function BMUSelectionHistory(node, bmuSelector, map, isActive, layers, selectionCssClass) {


            this._selections = [];
            this._node = typeof node === "string" ? document.getElementById(node) : node;

            var self = this;
            bmuSelector.on("change", function (selectionEvent) {

                if (selectionEvent.stats.getIndices().length === 0){
                    return;
                }



                var areaSelectionNode = document.createElement("div");

                var screenshotGraphics = document.createElement("canvas").getContext("2d");
                screenshotGraphics.canvas.height = screenshotGraphics.canvas.width = 386;//magic number

                map.screenshot(screenshotGraphics, layers);
                areaSelectionNode.appendChild(screenshotGraphics.canvas);
                self._node.insertBefore(areaSelectionNode, self._node.firstChild);

                areaSelectionNode.addEventListener("mouseenter", select);
                areaSelectionNode.addEventListener("click", select);

                for (var i = 0; i < self._selections.length; i += 1){
                    self._selections[i].areaSelectionNode.classList.remove(selectionCssClass);
                }
                areaSelectionNode.classList.add(selectionCssClass);


                function select() {
                    if (isActive()) {
                        return;
                    }

                    for (var i = 0; i < self._selections.length; i += 1){
                        self._selections[i].areaSelectionNode.classList.remove(selectionCssClass);
                    }


                    bmuSelector.select(selectionEvent);
                    areaSelectionNode.classList.add(selectionCssClass);
                }


                self._selections.push({
                    selectionEvent: selectionEvent,
                    areaSelectionNode: areaSelectionNode
                });

            });


        }


    });


});