#!/usr/bin/env node

var prompt = require('prompt'),
  client = require('phonegap-build-api'),
  fs = require('fs'),
  config = require('./cordova-utils-config.json');

require('shelljs/global');

var schema = {
  properties: {
    name: {
      description: 'Enter Phonegap username',
      required: true
    },
    password: {
      description: 'Enter Phonegap password',
      hidden: true
    }
  }
};

var getPhonegapData = function() {
  mkdir('-p', config.phonegapTokenPath.substring(config.phonegapTokenPath.lastIndexOf('/'), config.phonegapTokenPath.length));
  prompt.start();
  prompt.get(schema, function(err, result) {
    client.auth({username: result.name, password: result.password}, function(e, api) {
      fs.writeFile(config.phonegapTokenPath, api.token);
    });
  });
};

if (!test('-f', config.phonegapTokenPath)) {
  getPhonegapData();
}