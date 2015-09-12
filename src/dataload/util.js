define([], function () {

    return {

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