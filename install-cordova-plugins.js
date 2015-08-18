#!/usr/bin/env node

var fs = require('fs');
var async = require('async');
var DOMParser = require('xmldom').DOMParser;
var XMLSerializer = require('xmldom').XMLSerializer;
var serializer = new XMLSerializer();
var pluginsToInstall = [];
var exec = require('child_process').exec;
var expeptionalPlugins = ['de.appplant.cordova.plugin.local-notification-sv', 'org.crosswalk.engine'];
require('shelljs/global');

var fetch;
if (test('-d', 'plugins') && test('-f', 'plugins/fetch.json')) {
  fetch = require('../plugins/fetch.json');
}
var pluginAlreadyInstalled = function(id) {
  if (typeof fetch === 'undefined') {
    return false;
  }
  for (key in fetch) {
    if (fetch[key].source.id === id) {
      return true;
    }
    if (id.indexOf('git') > -1) {
      var url = id.replace(/(https:\/\/github.com\/.*)#.*/g, '$1');
      var ref = id.replace(/https:\/\/github.com\/.*#(.*)/g, '$1');
      if (fetch[key].source.url === url && fetch[key].source.ref === ref) {
        return true;
      }
    }
  }
  return false;
};

fs.readFile('www/config.xml', 'utf-8', function(err, data) {
  if (err) {
    return rejectFile('Beim Lesen von config.xml ist ein Fehler aufgetreten: ' + err);
  }
  var doc = new DOMParser().parseFromString(data, 'application/xml');
  var plugins = doc.getElementsByTagName('gap:plugin');
  for (var key in plugins) {
    var plugin = plugins[key];
    if (typeof plugin.nodeType !== 'undefined' && plugin.localName === 'plugin') {
      var pluginName = plugin.getAttribute('name');
      var pluginVersion = plugin.getAttribute('version');
      var pluginSource = plugin.getAttribute('source');
      if (pluginSource === 'npm') {
        pluginsToInstall.push('cordova plugin add ' + pluginName + '@' + pluginVersion);
      } else if (pluginSource === 'pgb' && expeptionalPlugins.indexOf(pluginName) < -1) {
        console.log('WARN: add npm dependency for %s in version %s', pluginName, pluginVersion);
      }
    }
  }
  // expeptionalPlugins
  pluginsToInstall.push('cordova plugin add https://github.com/shabetya/cordova-plugin-local-notifications.git');

  async.eachSeries(pluginsToInstall, function _iterator(command, callback) {
    if (pluginAlreadyInstalled(command.replace(/cordova plugin add.(.*)/g, '$1'))) {
      console.log('skip: "%s" - already installed', command);
      callback();
    } else {
      console.log('run: ' + command);
      exec(command, function(error, stdout, stderr) {
        if (error != null) {
          console.error(error);
          callback(error);
        } else {
          // console.log(stdout);
          callback();
        }
      });
    }
  }, function _done() {
    if (test('-f', 'platforms/android/libs/android-support-v13.jar')) {
      console.log('removing platforms/android/libs/android-support-v4.jar since v13 is already installed');
      rm('-f', 'platforms/android/libs/android-support-v4.jar');
    }
  });
});
