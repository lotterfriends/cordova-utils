#!/usr/bin/env node

require('shelljs/global');

if (!test('-L', 'resources')) {
  ln('-sf', 'www/resources', 'resources');
}
if (!test('-L', 'config.xml')) {
  ln('-sf', 'www/config.xml', 'config.xml');
}