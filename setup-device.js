#!/usr/bin/env node

var async = require('async'),
  exec = require('child_process').exec,
  currentPackage = require('../package.json');

var device = process.argv[2];
if (typeof device === 'undefined') {
  return console.log('ERROR: enter device as parameter e.g. "node scripts/setup-device.js android"');
}


var commands = [];
commands.push('node scripts/setup-links.js');
if (device === 'all') {
  currentPackage.cordovaPlatforms.forEach(function(platform) {
    commands.push('cordova platform add ' + platform);
  });
} else {
  commands.push('cordova platform add ' + device);
}
commands.push('cordova browser add crosswalk');
commands.push('node scripts/install-cordova-plugins.js');

async.eachSeries(commands, function _iterator(command, callback) {
  exec(command, function(error, stdout, stderr) {
    if (error != null) {
      console.error(error);
      callback(error);
    } else {
      console.log(stdout);
      callback();
    }
  });
});
