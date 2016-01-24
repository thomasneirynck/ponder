define(
    [
        "type",
        "jquery"
    ], function (type, jquery) {


        return type({

            constructor: function Histogram(node, counts) {
                this._node = node;
                this._counts = counts;

                this._maxCount = -Infinity;
                for (var i in this._counts) {//we'll map everything to the maximum count
                    this._maxCount = Math.max(this._maxCount, this._counts[i]);
                }

            },

            setData: function (selectionValues) {

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
                    bardiv.appendChild(bar);

                    var filler = document.createElement("div");

                    filler.style.width = (100 * countsForSelection[categoryLabel] / this._maxCount) + "%";
                    console.log("for " +categoryLabel + " we have " + countsForSelection[categoryLabel] + " samples " + 100 * countsForSelection[categoryLabel] / this._maxCount +"%");
                    filler.style.height = "100%";

                    bar.appendChild(filler);
                    bar.title = countsForSelection[categoryLabel] + " out of a total of " + " " + this._counts[categoryLabel];


                }


            }


        });


    });