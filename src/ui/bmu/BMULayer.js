define([
        "type", "Evented", "../EasingInput", "./Legend", "./classColors"
    ],
    function (type, Evented, EasingInput, Legend, classColors) {


        return type(Object.prototype, Evented.prototype, {

            constructor: function BMULayer(labelNode, classNode, sizeNode, sizeEasingNode, legendOutputDiv, dataTable, bmus) {

                Evented.call(this);

                this._dataTable = dataTable;
                this._bmus = bmus;

                var labelSelectTag = $("<select />");
                var classSelectTag = $("<select />");
                for (var index in dataTable.getColumns()) {
                    $("<option />", {value: index, text: dataTable.getColumns()[index]}).appendTo(labelSelectTag);
                    $("<option />", {value: index, text: dataTable.getColumns()[index]}).appendTo(classSelectTag);
                }

                labelSelectTag.appendTo("#" + labelNode);
                labelSelectTag.css("width", "100%");
                labelSelectTag.on("change", this.invalidate.bind(this));
                this._labelElement = labelSelectTag[0];

                var self = this;
                classSelectTag.appendTo("#" + classNode);
                classSelectTag.css("width", "100%");
                classSelectTag.on("change", function () {
                    self.invalidate();
                    self.emit("classChange", self._classElement.value);
                });
                this._classElement = classSelectTag[0];


                this._legend = new Legend(legendOutputDiv, this);

                this._legend.on("invalidate", this.invalidate.bind(this));


                var sizeTag = $("<select />");
                for (index in dataTable.getSelectedOrdinalColumns()) {
                    $("<option />", {
                        value: dataTable.getColumnIndex(dataTable.getSelectedOrdinalColumns()[index]),
                        text: dataTable.getSelectedOrdinalColumns()[index]
                    }).appendTo(sizeTag);
                }
                sizeTag.css("width", "100%");
                sizeTag.appendTo("#" + sizeNode);
                sizeTag.on("change", this.invalidate.bind(this));
                this._sizeElement = sizeTag[0];

                this._easingInput = new EasingInput(sizeEasingNode, document.createElement("div"));
                this._easingInput.on("input", this.invalidate.bind(this));

            },


            selectBmusFromController: function (areaSelectLayerController) {

                var selectedIndices = [];
                for (var i = 0; i < this._bmus.length; i += 1) {
                    if (areaSelectLayerController.isInsideSelectedWorldArea(this._bmus[i].x, this._bmus[i].y)) {
                        selectedIndices.push(i);
                    }
                }

                return selectedIndices;

            },

            _getOrdinalPosition: function (minMax, value) {
                return (parseFloat(value) - minMax[0]) / (minMax[1] - minMax[0]);
            },

            paint: function (context2d, map) {

                var minMaxForSize = this._dataTable.getMinMax(this._sizeElement.value);
                var minArea = Math.PI * Math.pow(5, 2);
                var maxArea = Math.PI * Math.pow(20, 2);

                var area, size, ordinalPositionForSize, alpha, thickness, color;

                var colorClassifier = this._getClassifier();

                var value;
                for (var i = 0; i < this._bmus.length; i += 1) {

                    context2d.save();

                    ordinalPositionForSize = this._getOrdinalPosition(minMaxForSize, this._dataTable.getValueByRowAndColumnIndex(i, this._sizeElement.value));

                    if (ordinalPositionForSize > this._easingInput.getA()) {
                        alpha = 1 - ordinalPositionForSize + this._easingInput.getA();
                        thickness = 1;
                        color = "rgba(0,0,0,0.8)";
                    } else {
                        alpha = 1;
                        thickness = 1;
                        color = "rgba(255,255,255, 0.95)";
                    }

                    area = minArea + this._easingInput.getEasingFunction()(ordinalPositionForSize) * (maxArea - minArea);
                    size = Math.round(Math.sqrt(area / (Math.PI)));


                    context2d.beginPath();
                    context2d.arc(map.toViewX(this._bmus[i].x, context2d), map.toViewY(this._bmus[i].y, context2d), size, 0, Math.PI * 2);
                    context2d.fillStyle = colorClassifier(this._dataTable.getValueByRowAndColumnIndex(i, this._classElement.value));
                    //context2d.globalAlpha = alpha;
                    context2d.fill();
                    context2d.lineWidth = thickness;
                    context2d.strokeStyle = color;
                    context2d.stroke();


                    context2d.fillText(this._dataTable.getValueByRowAndColumnIndex(i, this._labelElement.value), map.toViewX(this._bmus[i].x, context2d), map.toViewY(this._bmus[i].y, context2d));

                    context2d.restore();


                } },


            _getClassifier: function () {

                var uniques;
                var clazz = parseInt(this._classElement.value);
                if (this._dataTable.isCategory(clazz) || this._dataTable.isExcluded(clazz)) {
                    uniques = this._dataTable.getUniqueValues(clazz);
                    return function categoryClassifier(classValue) {
                        return classColors[uniques.indexOf(classValue) % classColors.length];
                    };
                }

                //ordinal type
                var minMax = this._dataTable.getMinMax(clazz);
                var self = this;
                return function (classValue) {
                    return (self._getOrdinalPosition(minMax, classValue) >= self._legend.getBreak()) ? classColors[1] : classColors[0];
                };


            },

            getLegend: function () {

                var clazz = parseInt(this._classElement.value);
                if (this._dataTable.isOrdinal(clazz)) {
                    return {
                        type: "ORDINAL",
                        classifier: this._getClassifier(),
                        minMax: this._dataTable.getMinMax(clazz),
                        lower: classColors[0],
                        higher: classColors[1]
                    };
                } else {
                    return {
                        type: "CATEGORY",
                        classifier: this._getClassifier(),
                        values: this._dataTable.getUniqueValues(clazz)
                    };
                }
            },

            getDataTable: function () {
                return this._dataTable;
            },

            getBmus: function () {
                return this._bmus;
            },

            invalidate: function () {
                this.emit("invalidate", this);
            }

        });


    });