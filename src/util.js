define([], function () {

    return {
        getParameterByName: function getParameterByName(name) {
            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                results = regex.exec(location.search);
            return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        },
        toNumber: function toNumber(value) {
            if (!isNaN(parseFloat(value))) {
                return parseFloat(value);
            } else if (typeof value === "string") {
                return parseFloat(value.replace(/^\D*/g, '').replace(/\D*$/g, ''));
            } else {
                return NaN;
            }
        }
    };

});