define([], function(){

    //from http://stackoverflow.com/questions/521295/javascript-random-seeds,
    // Author: Antti Sykari
    // retrieved, 2015/12/25

    return function createSeededRandom(seed){
        return function random() {
            var x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };
    };
});