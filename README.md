# cordova-utils

```sh
npm install --save archiver async phonegap-build-api prompt shelljs when xmldom
```

## directory structure

```
package.json
platforms - generated
config.xml - link to www/config.xml - created by setup-links.js
plugins - generated
resources - link to www/resources - created by setup-links.js
scripts - this repo
tmp - generated
www
 |- app 
 |- assets
 |- resources
 |- config.xml
 \- index.html

```

## example package.json
```json
{
  "name": "project-name",
  "version": "0.0.0",
  "build": 20,
  "description": "",
  "scripts": {
    "cleanup-cordova": "node scripts/cleanup-cordova.js",
    "setup-cordova": "node scripts/setup-device.js all",
    "setup-android": "node scripts/setup-device.js android",
    "setup-ios": "node scripts/setup-device.js ios",
    "install-cordova-plugins": "node scripts/install-cordova-plugins.js",
    "prephonegap-deploy": "npm run init",
    "phonegap-deploy": "node scripts/phonegap-deploy.js"
  },
  "devDependencies": {
    "archiver": "0.14.4",
    "async": "1.2.1",
    "phonegap-build-api": "^0.3.3",
    "prompt": "^0.2.14",
    "shelljs": "^0.3.0",
    "when": "^3.7.3",
    "xmldom": "^0.1.19"
  },
  "cordovaPlugins": [],
  "cordovaPlatforms": [
    "android",
    "ios"
  ]
}
```
