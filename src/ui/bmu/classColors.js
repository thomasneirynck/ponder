define(["../../Random"], function (Random) {


    var random = Random(1);

    var colors = [];
    for (var i = 0; i < 256; i += 1) {
        colors.push({
            r: (Math.round((random() * 255 + 255) / 2)),
            g: (Math.round((random() * 255 + 255) / 2)),
            b: (Math.round((random() * 255 + 255) / 2))
        });
    }

    colors = colors.map(function (color) {
        return "rgb(" + color.r + "," + color.g + "," + color.b + ")";
    });


    colors.unshift("rgb(255, 247, 229)","rgb(223,114,62)");

    return colors;

});