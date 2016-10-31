define(
    [
        "type",
        "jquery"
    ], function (type, jquery) {


        return type({

            constructor: function Histogram(node, counts) {
                this._node = node;
                this._counts = counts;
                console.log(this._counts);

                this._maxCount = -Infinity;
                for (var i in this._counts) {//we'll map everything to the maximum count
                    this._maxCount = Math.max(this._maxCount, this._counts[i]);
                }

            },

            setData: function (selectionValues) {

                console.log('histo', selectionValues);

                var countsForSelection = {};
                for (var category in this._counts) {
                    countsForSelection[category] = 0;
                }
                for (var i = 0; i < selectionValues.length; i += 1) {
                    countsForSelection[selectionValues[i]] += 1;
                }


                this._node.innerHTML = "";
                for (var categoryLabel in countsForSelection) {

                    var bardiv = document.createElement("div");
                    bardiv.style.width = "100%";
                    this._node.appendChild(bardiv);

                    var labelDiv = document.createElement("div");
                    labelDiv.innerHTML = categoryLabel;


                    bardiv.appendChild(labelDiv);


                    var bar = document.createElement("div");
                    bar.style.height = "100%";
                    //bar.style.width = (100 * this._counts[categoryLabel] / this._maxCount) + "%";
                    bardiv.appendChild(bar);


                    var outline = document.createElement("div");
                    outline.style.width = (100 * this._counts[categoryLabel] / this._maxCount) + "%";
                    outline.style.height = "100%";
                    bar.appendChild(outline);


                    var filler = document.createElement("div");

                    filler.style.width = (100 * countsForSelection[categoryLabel] / this._counts[categoryLabel] ) + "%";
                    filler.style.height = "100%";
                    outline.appendChild(filler);


                    bar.title = countsForSelection[categoryLabel] + " out of a total of " + " " + this._counts[categoryLabel];


                }


            }


        });


    });