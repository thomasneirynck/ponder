define([
    'intern!object',
    'intern/chai!assert',
    'ponder/SOM'
], function (registerSuite, assert, SOM) {


    registerSuite({
        name: 'SOM',
        construct: function () {
            var aTree = new SOM();
            assert.equal(aTree.constructor, SOM, "should be vanilla prototype inheritance");
        }
    });

});