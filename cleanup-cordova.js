#!/usr/bin/env node

require('shelljs/global');

rm('-f', 'config.xml');
rm('-f', 'resources');
rm('-rf', 'plugins');
rm('-rf', 'platforms');
