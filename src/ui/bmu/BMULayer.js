define([
        "type", "Evented", "../EasingInput", "./Legend", "./classColors", "../../util"
    ],
    function (type, Evented, EasingInput, Legend, classColors, util) {

        function generateIcon(color, halfSize) {
            var context2d = document.createElement("canvas").getContext("2d");
            context2d.canvas.width = context2d.canvas.height = halfSize * 2;
            context2d.beginPath();
            context2d.arc(context2d.canvas.width / 2, context2d.canvas.height / 2, halfSize - PADDING, 0, Math.PI * 2);
            context2d.fillStyle = color;
            context2d.fill();
            return context2d.canvas;
        }

        var GLOWMAXSIZE = 16;
        var PADDING = 1;
        var MINAREA = Math.PI * Math.pow(1, 2);
        var MAXAREA = Math.PI * Math.pow(20, 2);
        var MAXRADIUS = areaToRadius(MAXAREA);
        var HALOWIDTH = 2 + PADDING;
        var HALOICON = generateIcon("rgba(255,255,255,0.8)", MAXRADIUS * 2 + GLOWMAXSIZE + HALOWIDTH);

        function jigger(float) {

            return float;
        }

        function areaToRadius(area) {
            return Math.ceil(Math.sqrt(area / (Math.PI)));
        }


        var ICONCACHE = {};


        function squareDistance(x1, y1, x2, y2) {
            return Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
        }

        return type(Object.prototype, Evented.prototype, {

            constructor: function BMULayer(labelNode, classNode, sizeNode, sizeEasingNode, legendOutputDiv, dataTable, bmus) {

                Evented.call(this);

                this._dataTable = dataTable;
                this._bmus = bmus.map(function (bmu, index) {
                    var bmuView = Object.create(bmu);
                    bmuView.radius = -1;
                    bmuView.index = index;
                    bmuView.icon = null;
                    return bmuView;
                });
                this._highlights = [];

                var labelSelectTag = $("<select />");
                var classSelectTag = $("<select />");
                for (var index in dataTable.getColumns()) {
                    $("<option />", {value: index, text: dataTable.getColumns()[index]}).appendTo(labelSelectTag);
                    $("<option />", {value: index, text: dataTable.getColumns()[index]}).appendTo(classSelectTag);
                }

                var self = this;

                function setEasingInputMode() {
                    self.invalidate();
                    if (self._dataTable.isOrdinal(self._classElement.value)) {
                        self._easingInput.setEasingMode("log");
                    } else {
                        self._easingInput.setEasingMode("constant");
                    }
                    self.emit("classChange", self._classElement.value);
                }

                classSelectTag.appendTo("#" + classNode);
                classSelectTag.on("change", setEasingInputMode);
                this._classElement = classSelectTag[0];

                self._dirty = true;
                function flagDirt() {
                    self._dirty = true;
                }


                this._classElement.addEventListener("change", flagDirt);


                this._legend = new Legend(legendOutputDiv, this);
                this._legend.on("invalidate", this.invalidate.bind(this));
                this._legend.on("invalidate", flagDirt);


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
                this._sizeElement.addEventListener("change", flagDirt);

                this._easingInput = new EasingInput(sizeEasingNode, document.createElement("div"));
                this._easingInput.on("input", this.invalidate.bind(this));
                this._easingInput.on("input", flagDirt);


                var column = util.getParameterByName("initial");
                if (column && dataTable.getColumns().indexOf(column) >= 0){
                    this._classElement.value = dataTable.getColumns().indexOf(column);
                }

                setEasingInputMode();

            },

            formatForItem: function (itemId) {
                var featureData = this._dataTable.getFeatureData(itemId);

                var wrap = document.createElement("div");
                var elem, name, value;
                for (var i = 0; i < featureData.length; i += 1) {
                    elem = document.createElement("div");

                    name = document.createElement("span");
                    name.innerHTML = this._dataTable.getColumnName(i);
                    elem.appendChild(name);

                    value = document.createElement("span");
                    value.innerHTML = featureData[i];
                    elem.appendChild(value);

                    wrap.appendChild(elem);
                }

                return wrap;


            },

            getHighlightCount: function () {
                return this._highlights.length;
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


            _recomputeSizeColor: function () {

                if (!this._dirty) {
                    return;
                }

                var classValue = this._classElement.value;
                var minMaxForSize = this._dataTable.getMinMax(classValue);

                var area, size, ordinalPositionForSize;

                var colorClassifier = this._getClassifier();
                var isOrdinal = this._dataTable.isOrdinal(classValue);
                var fillStyle;
                for (var i = 0; i < this._bmus.length; i += 1) {
                    ordinalPositionForSize = isOrdinal ? this._getOrdinalPosition(minMaxForSize, this._dataTable.getValueByRowAndColumnIndex(i, classValue)) : -1;

                    area = MINAREA + this._easingInput.getEasingFunction()(ordinalPositionForSize) * (MAXAREA - MINAREA);
                    size = areaToRadius(area);
                    this._bmus[i].radius = size;

                    fillStyle = colorClassifier(this._dataTable.getValueByRowAndColumnIndex(i, classValue));
                    if (!ICONCACHE[fillStyle]) {
                        ICONCACHE[fillStyle] = generateIcon(fillStyle, MAXRADIUS);
                    }
                    this._bmus[i].icon = ICONCACHE[fillStyle];

                }

                this._iconDirty = false;
                this._dirty = false;
            },


            _getOutlineWidth: function (bmu) {
                if (!bmu.highlight) {
                    return HALOWIDTH;
                }
                var pulseTime = 1000;
                var offset = Date.now() % pulseTime;

                if (offset > pulseTime / 2) {
                    offset = pulseTime - offset;
                }

                return HALOWIDTH + (GLOWMAXSIZE * offset / (pulseTime / 2));

            },

            paint: function (context2d, map) {


                this._recomputeSizeColor();
                var atLeastOneHighlight = false;
                var x, y, haloSize;
                for (var i = 0; i < this._bmus.length; i += 1) {

                    x = jigger(map.toViewX(this._bmus[i].x));
                    y = jigger(map.toViewY(this._bmus[i].y));

                    haloSize = this._bmus[i].radius * 2 + this._getOutlineWidth(this._bmus[i]);

                    context2d.drawImage(HALOICON, x - haloSize / 2, y - haloSize / 2, haloSize, haloSize);
                    context2d.drawImage(this._bmus[i].icon, x - this._bmus[i].radius, y - this._bmus[i].radius, this._bmus[i].radius * 2, this._bmus[i].radius * 2);

                    atLeastOneHighlight = atLeastOneHighlight || this._bmus[i].highlight;
                }


                if (atLeastOneHighlight) {
                    this.invalidate();
                }
            },


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

            find: function (x, y, map) {
                var bx, by;
                var items = [];
                for (var i = 0; i < this._bmus.length; i += 1) {
                    bx = jigger(map.toViewX(this._bmus[i].x));
                    by = jigger(map.toViewY(this._bmus[i].y));
                    if (squareDistance(bx, by, x, y) <= Math.pow(this._bmus[i].radius + HALOWIDTH, 2)) {
                        items.push(i);
                    }
                }
                return items;
            },


            filterBmus: function (clazz, value) {
                return this._dataTable.filterItems(clazz, value);
            },

            getClass: function () {
                return this._classElement.value;
            },

            highlight: function (items) {

                var i;
                for (i = 0; i < this._highlights.length; i += 1) {
                    this._bmus[this._highlights[i]].highlight = false;
                }
                for (i = 0; i < items.length; i += 1) {
                    this._bmus[items[i]].highlight = true;
                }
                this._highlights = items;
                this.invalidate();
            },

            getLegend: function () {

                var clazz = this._classElement.value;
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

            getBmuIndices: function () {
                var inds = [];
                for (var i = 0; i < this._bmus.length; i++) {
                    inds.push(i);
                }
                return inds;
            },

            invalidate: function () {
                this.emit("invalidate", this);
            }

        });


    });