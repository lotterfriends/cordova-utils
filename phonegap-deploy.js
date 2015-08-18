#!/usr/bin/env node

var client = require('phonegap-build-api'),
  archiver = require('archiver'),
  when = require('when'),
  pipeline = require('when/pipeline'),
  async = require('async'),
  prompt = require('prompt'),
  fs = require('fs'),
  DOMParser = require('xmldom').DOMParser;

var currentPackage = require('../package.json');
var config = require('./cordova-utils-config.json')

// filled by readAppData
var appPackage = ''; // config.xml <widget> -> attribute id
var appTitle = ''; // config.xml <name>
var zipName = '';

require('shelljs/global');

var readAppData = function() {
  return when.promise(function(resolve, reject) {
    fs.readFile('www/config.xml', 'utf-8', function(e, data) {
      if (e) {
        return reject('an error occure during reading config.xml: ' + e);
      }
      var doc = new DOMParser().parseFromString(data, 'application/xml');
      var widget = doc.getElementsByTagName('widget')[0];
      appPackage = widget.getAttribute('id');
      appTitle = doc.getElementsByTagName('name')[0].textContent;
      zipName = [appTitle, '-', currentPackage.version, '.zip'].join('');
      console.log('App package', appPackage);
      console.log('App title', appTitle);
      resolve();
    });
  });
};

var prepareForUpload = function() {
  return when.promise(function(resolve, reject) {
    if (!test('-f', config.phonegapTokenPath)) {
      return reject('get a phonegap api token first');
    }
    var zipsInAppDirectory = ls('www/*.zip');
    if (zipsInAppDirectory.length) {
      return reject('Delete archives in the www directory first. Found: ' + zipsInAppDirectory.join(' '));
    }
    resolve();
  });
};

var createZipFile = function() {
  return when.promise(function(resolve, reject) {
    mkdir('-p', './build');
    cp('-rf', './www/*', './build');
    rm('-rf', zipName);
    var output = fs.createWriteStream(zipName);
    var archive;
    output.on('open', function() {
      archive = archiver.create('zip', {
        comment: Date.now()
      });

      archive.on('error', function(err) {
        return reject('Can\'t create the archive file: ' + err);
      });

      archive.pipe(output);

      archive.bulk([{
        expand: true,
        cwd: './build',
        src: ['**'],
        dest: '.'
      }]);
      archive.finalize();
    });

    output.on('close', function() {
      console.log('archive file %s created with %s total bytes', zipName, archive.pointer());
      rm('-rf', './build');
      resolve();
    });

  });
};

var getAuthToken = function() {
  return when.promise(function(resolve, reject) {
    fs.readFile(config.phonegapTokenPath, 'utf-8', function(err, data) {
      if (err) {
        reject('Can\'t read token file');
      } else {
        console.log('Phonegap api token found %s', data);
        client.auth({token: data}, function(e, api) {
          if (e) {
            reject('login error');
          } else {
            console.log('successfully loggedin to phonegap');
            resolve(api);
          }
        });
      }
    });
  });
};

var getApp = function(api) {
  return when.promise(function(resolve, reject) {
    api.get('/apps', function(e, data) {
      if (e) {
        reject('an error occure durung loading the app ' + e);
      } else {
        data.apps.forEach(function(currentApp) {
          if (currentApp.package === appPackage) {
            console.log('use app with id: ' + currentApp.id);
            return resolve({api: api, app: currentApp});
          }
        });
        return reject('app not found');
      }
    });
  });
};

var getSigningKeys = function(api) {
  return when.promise(function(resolve, reject) {
    api.get('/keys/ios', function(e, data) {
      if (e) {
        reject('an error occure durung loading the signing keys ' + e);
      } else {
        resolve({api: api, keys: data.keys});
      }
    });
  });
};

var unlockSigningKeys = function(data) {
  return when.promise(function(resolve, reject) {

    var keyPipe = [];
    data.keys.forEach(function(key) {
      if (!key.locked) {
        return true;
      }
      keyPipe.push(function() {
        var system = key.link.replace(/.*keys\/(.*)\/.*/, '$1');
        var schema = [];
        schema.push({
          name: system,
          description: 'Enter ' + system + ' signingkey password',
          hidden: true
        });

        return when.promise(function(resolveKey, rejectKey) {

          prompt.get(schema, function(err, result) {
            var options = {
              form: {
                data: {
                  password: result[system]
                }
              }
            };
            data.api.put('/keys/' + system + '/' + key.id, options, function(e) {
              if (e) {
                rejectKey('Unlock ' + system + ' signingkey failed' + e);
              } else {
                resolveKey();
              }
            });
          });
        });

      });

    });

    var signing = pipeline(keyPipe);

    signing.then(function() {
      console.log('Sigingkeys successfully unlocked');
      resolve(data.api);
    }).catch(function(error) {
      reject('Unlock the signing keys failed ' + error);
    });

  });
};

var startUpload = function(data) {
  console.log('Upload of %s started', zipName);
  var options = {
    form: {
      data: {
        title: appTitle,
        debug: false,
        version: currentPackage.version,
        private: true
      },
      file: zipName
    }
  };
  return when.promise(function(resolve, reject) {
    data.api.put('/apps/' + data.app.id, options, function(e, data) {
      if (e) {
        reject('The upload failed ' + e);
      } else {
        resolve();
      }
    });
  });
};

var phases = [];
phases.push(readAppData);
phases.push(prepareForUpload);
phases.push(createZipFile);
phases.push(getAuthToken);
phases.push(getSigningKeys);
phases.push(unlockSigningKeys);
phases.push(getApp);
phases.push(startUpload);
var build = pipeline(phases);

build.then(function() {
  console.log('Upload successful, build starts automatically.');
}).catch(function(error) {
  console.log('ERROR: ' + error);
});