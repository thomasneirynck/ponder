define([
    "type",
    "jquery"
], function (type, jquery) {


    return type({


        constructor: function BMUSelectionHistory(node, bmuSelector, map, isActive, layers, selectionCssClass) {


            this._selections = [];
            this._node = typeof node === "string" ? document.getElementById(node) : node;

            var self = this;

            function removeSelectionCSSClass() {
                for (var i = 0; i < self._selections.length; i += 1) {
                    self._selections[i].areaSelectionNode.classList.remove(selectionCssClass);
                }
            }

            bmuSelector.on("clear", removeSelectionCSSClass);
            bmuSelector.on("clear", function () {
                if (self._selections.length) {
                    self._selections[0].select();
                }
            });


            bmuSelector.on("change", function (selectionEvent) {


                var areaSelectionNode = document.createElement("div");

                var screenshotGraphics = document.createElement("canvas").getContext("2d");
                screenshotGraphics.canvas.height = screenshotGraphics.canvas.width = 386;//magic number

                map.screenshot(screenshotGraphics, layers);
                areaSelectionNode.appendChild(screenshotGraphics.canvas);
                self._node.insertBefore(areaSelectionNode, self._node.firstChild);



                removeSelectionCSSClass();
                areaSelectionNode.classList.add(selectionCssClass);


                var selectionHistoryNode = {
                    selectionEvent: selectionEvent,
                    areaSelectionNode: areaSelectionNode,
                    select: function () {
                        if (isActive()) {
                            return;
                        }
                        removeSelectionCSSClass();
                        bmuSelector.select(this.selectionEvent);
                        this.areaSelectionNode.classList.add(selectionCssClass);
                    }
                };

                self._selections.push(selectionHistoryNode);
                areaSelectionNode.addEventListener("click", selectionHistoryNode.select.bind(selectionHistoryNode));

            });


        }


    });


});