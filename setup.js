#!/usr/bin/env node

/**
 * Installs the node module and bower component dependencies.
 */


var exec = require('child_process').exec;

console.log("Installing node and bower dependencies. Please wait...");
exec("npm install", runCommand.bind(null, "node module dependencies succesfully installed", "Could not install node module dependencies"));
exec("bower install", runCommand.bind(null, "bower compononent dependencies succesfully installed", "Could not install bower component dependencies"));

function runCommand(successMessage, errorMessage, error, stdout, stderr) {
    if (stderr) {
        console.error(stderr);
    }
    if (stdout) {
        console.log(stdout);
    }
    if (error) {
        console.error(errorMessage);
        console.error(error);
    } else {
        console.log(successMessage);
    }
}



