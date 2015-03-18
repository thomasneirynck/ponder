define([
    'intern!tdd',
    'intern/chai!assert',
    'ponder/SOM'
], function (tdd, assert, SOM) {

    //run "./node_modules/.bin/intern-client" config=tests/intern suites=tests/all
    tdd.suite("test", function () {
        tdd.test("constructor", function () {
            var som = new SOM({
                width: 4,
                height: 4,
                codeBookSize: 3
            });
            assert.equal(som.constructor, SOM, "should be vanilla prototype inheritance");
        });

        tdd.test("bmu", function () {
            var som = new SOM({
                width: 2,
                height: 3,
                codeBookSize: 3
            });
            som._neuralWeights = [0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

            var out = {};
            som.bmu([0, 0, 0, 1, 1, 1], 3, out);
            assert.equal(out.i, 3, "should be at 4th index in data");
            assert.equal(out.x, 0, "first row");
            assert.equal(out.y, 1, "second element");
        });
    });


});