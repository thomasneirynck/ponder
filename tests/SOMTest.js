define([
    'intern!tdd',
    'intern/chai!assert',
    'ponder/SOM'
], function (tdd, assert, SOM) {

    //run "./node_modules/.bin/intern-client" config=tests/intern suites=tests/all
    tdd.suite("test", function () {
        tdd.test("constructor", function () {
            var aTree = new SOM({
                width: 10,
                height: 10,
                codeBookSize: 3
            });
            assert.equal(aTree.constructor, SOM, "should be vanilla prototype inheritance");
        });

    });


});