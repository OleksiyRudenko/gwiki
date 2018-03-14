'use strict';
const fs = require('fs');
const fse = require('fs-extra');
const PARSEABLE_FILES = ['js', 'html', 'htm'];

console.log('bundle-flat is a simple tool to collect all project files into a distribution directory flattening the code base tree structure.');
console.log('node bundle-flat.js --help for help on CLI arguments.');

var config = getConfig({
  entry: null,
  destination: './dist',
  'entry-root-is': './',
});


if (config.help || !config.entry) {
  console.log(`Parses source code starting from entry point, collects files referred to in script and img src attributes and puts those flat into a destination directory. 
Fully qualified URLs are ignored.
If either part of partial url is a file then such part is replaced with contents of the file assuming the file contains a path fragment (a feature from some web servers).
If either URL ends with a slash character or directory name then index.html is assumed as a principal target.

Usage: node bundle-flat <entryPoint> [options...]
  entryPoint - file or path to start with
  --destination=<path> - project files will be collected under <path>
  --entry-root-is=<path> - whenever URL starts with a slash or directory name the <path> is prepended unless empty
`);
}

if (!config.help && !config.entry) process.exit(1);

// normalize every path in config
config.entry = normalizeConfigPath(config.entry);
config.destination = normalizeConfigPath(config.destination);
config['entry-root-is'] = normalizeConfigPath(config['entry-root-is']);
// console.log(config);

// ensure and clean up the destination dir
try {
  console.log('=== Cleaning up ' + config.destination);
  fse.emptyDirSync(config.destination);
  console.log('OK');
} catch (err) {
  console.log('ERROR: ' + err);
}

// make real root an array of path components
var realRoot = splitPath(config['entry-root-is']);

// build source code tree
console.log('=== Building code base map from ' + config.entry);
var codeBaseMap = extractCodeBaseFiles({}, config.entry, realRoot);

console.log('Code base map:');
console.log(codeBaseMap);

function extractCodeBaseFiles(fileMap, fileRef, realRoot) {
  var realFilePath = getRealFilePath(fileRef, realRoot);
  var fileName = realFilePath.split('/').slice(-1)[0];
  fileMap[fileRef] = {
    realFilePath : realFilePath,
    fileName : fileName,
  };

  // extract files from src
  var fileExt = fileName.split('.').slice(-1)[0].toLowerCase();
  if (PARSEABLE_FILES.includes(fileExt)) {
    // TODO: extract files from src attribute
  }

  return fileMap;
}

function getRealFilePath(fileRef, realRoot) {
  var path = splitPath(fileRef);
  if (!path[0]) {
    path = [ ...realRoot, ...path];
  }
  console.log('getRealFilePath');
  // if either part of path is a file whereas it should be a dir then get path component from there
  for (var i = 0, dir = ''; i < path.length - 1; i++) {
    dir = path.slice(0, i+1).join('/');
    if (path[i][0] !== '.' && isFile(dir)) {
      try {
        path[i] = fs.readFileSync(dir, 'utf-8').toString().split('\n')[0].split('/').filter(function(el){return !!el;});
      } catch (err) {
        console.log('ERROR at getRealFilePath(): ' + err);
      }
    }
  }

  // path = path.filter(function(el) { return !!el});

  console.log(path);

  return path.join('/');
}

/**
 * Tests whether the path refers to a file
 * @param {string} path
 */
function isFile(path) {
  try {
    return fs.lstatSync(path).isFile();
  } catch (err) {
    console.log('ERROR at isFile(): ' + err);
  }
}

/**
 * Normalize source code file path
 * @param {string} path
 * @returns {[]}
 */
function splitPath(path) {
  var pathComponents = path.split('/');
  if (!pathComponents[pathComponents.length-1]) pathComponents[pathComponents.length-1] = 'index.html';
  pathComponents = pathComponents.filter(function(el) { return !!el});
  return pathComponents;
}

/**
 * Normalizes path in config so it starts with './' unless already is a relative path
 * @param {string} path
 */
function normalizeConfigPath(path) {
  if (path[0] !== '/' && path[0] !== '.') path = '/' + path;
  if (path[0] !== '.') path = '.' + path;
  return path;
}

/**
 * Extracts script config from CLI arguments
 * @param defaultConfig
 */
function getConfig(defaultConfig) {
  process.argv.forEach(function(argument, idx) {
    if (idx>1) {
      if (argument.substr(0,2) === '--') {
        var key, value;
        [key, value] = argument.slice(2).split('=');
        defaultConfig[key] = value;
      } else {
        defaultConfig.entry = argument;
      }
    }
  });
  return defaultConfig;
}
