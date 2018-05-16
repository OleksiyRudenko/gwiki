'use strict';
const promisify = require('es6-promisify');
const fs = require('fs');
const fse = require('fs-extra');
const fextractor = require('file-extractor');
const PARSEABLE_FILES = ['js', 'html', 'htm'];

let config = {
  entry: null,
  destination: './dist',
  'real-root-is': null,
  verbose: false,
  flatten: false,
  watch: false,
};

parseConfig(config).then(config => {
  if (config.help || !config.entry) helpUsage();
  if (!config.help && !config.entry) process.exit(1);
  // Main task
  bundle(config);
});

/**
 * Bundles code base using settings
 * @param {object} config
 */
function bundle(config) {
  // ensure and clean up the destination dir
  try {
    if (config.verbose) console.log('=== Cleaning up ' + config.destination);
    fse.emptyDirSync(config.destination);
    if (config.verbose) console.log('OK');
  } catch (err) {
    console.log('ERROR at bundle(): ' + err);
    process.exit(1);
  }
  // collect local project files
  let codeBaseMap = mapCodeBaseFile({}, config.entry, config['real-root-is']);
  if (config.verbose) {
    console.log('=== Code Base Map:');
    console.log(codeBaseMap);
  }
}

/**
 * Builds code base map for a given file
 * @param {object} map - code base map
 * @param {string} fileRef - reference to a file
 * @param {string} realRoot - app real root location
 * @returns {object} updated map
 */
async function mapCodeBaseFile(map, fileRef, realRoot) {
  let realFilePath = resolvePath(fileRef, realRoot);
  const fileName = realFilePath.split('/').slice(-1)[0];
  map[fileRef] = {
    realFilePath: realFilePath,
    fileName: fileName,
  };
  // extract local resources from the file and parse recursively
  const fileExt = fileName.split('.').slice(-1)[0].toLowerCase();
  if (PARSEABLE_FILES.includes(fileExt)) {
    const stream = fs.createReadStream(realFilePath, {});
    fextractor({urls:[]}, {successive: true}).matches(/src=['"](.+?)['"]/ig, (m, acc) => {
      acc.urls.push(m[1]);
    }).on('end', (acc) => {
      if (config.verbose) {
        console.log('--- extractCodeBaseFiles (urls):');
        console.log(acc.urls);
      }
      acc.urls.filter(url => {
        const prefix = url.slice(0,7);
        return !(prefix === 'https:/' || prefix === 'http://' || url.slice(0,2) === '//');
      }).forEach(url => {
        map = mapCodeBaseFile(map, url, realRoot);
      });
    }).start(stream);
  }
  return map;
}

/**
 * Resolves path parsing symlinks into path relative to project root
 * @param {string} path - source path
 * @param {string} realRoot - real root to prepend paths starting with '/'
 * @param {string} defaultFileIfNone - if path ends with no filename then this is added
 * @returns {string} resolved path relative to project root
 */
function resolvePath(path, realRoot = '', defaultFileIfNone = 'index.html') {
  if (config.verbose) console.log('Resolving path ' + path);
  if (!path.length) path = './';
  let resolvedPathComponents = path.split('/');
  if (resolvedPathComponents.length && !resolvedPathComponents[0] && realRoot.length) {
    // we've got reference to the app root
    const realRootComponents = realRoot.split('/').filter(el => !!el);
    path = mergePathComponents(realRootComponents, resolvedPathComponents);
  }
  if (path[0] !== '/' && path[0] !== '.') path = './' + path;
  // resolve symlinks
  path = resolveSymLinks(path);
  // add trailing '/' if target is not a file
  if (path[path.length - 1] !== '/' && !isFile(path)) path += '/';
  // if last path component is dir then add trailing slash and defaultFileIfNone
  if (!isFile(path) && defaultFileIfNone) {
    path = addFileName(path, defaultFileIfNone);
  }
  return path;
}

/**
 * Resolves symlink files into path
 * @param {string} path
 * @returns {string} resolved path
 */
function resolveSymLinks(path) {
  if (config.verbose) console.log('Resolving symlinks @ ' + path);
  let resolvedPathComponents = path.split('/');
  for (let i = 0, dir = ''; i < resolvedPathComponents.length - 1; i++) {
    // skip empty entries and current and parent folders aliases
    if (resolvedPathComponents[i] && resolvedPathComponents[i] !== '.' && resolvedPathComponents[i] !== '..') {
      dir = resolvedPathComponents.slice(0, i+1).join('/');
      if (isFile(dir)) {
        try {
          if (config.verbose) console.log(resolvedPathComponents[i] + ' >>');
          resolvedPathComponents[i] = fs.readFileSync(dir, 'utf-8').toString().split('\n')[0].split('/').filter(function(el){return !!el;}).join('/');
          if (config.verbose) console.log('>> ' + resolvedPathComponents[i]);
        } catch (err) {
          console.log('--- ERROR at resolveSymLinks(): ' + err);
          process.exit(1);
        }
      }
    }
  }
  return resolvedPathComponents.join('/');
}

/**
 * Adds filename to the path ensuring the filename delimited with '/' from the path
 * @param {string} path
 * @param {string} filename
 * @returns {string} fully qualified filepath
 */
function addFileName(path, filename) {
  return path + (path[path.length-1] === '/' && filename[0] !== '/' ? '' : '/') + filename;
}

/**
 * Tests whether the path refers to a file
 * @param {string} path
 * @returns {boolean}
 */
function isFile(path) {
  try {
    return fs.lstatSync(path).isFile();
  } catch (err) {
    console.log('--- ERROR at isFile(): ' + err);
    process.exit(1);
  }
}

/**
 * Merges two path components into a continuous path avoiding '//' sequences
 * @param {array} pathComponents1
 * @param {array} pathComponents2
 * @returns {string}
 */
function mergePathComponents(pathComponents1, pathComponents2) {
  // remove trailing empty elements from pathComponents1
  while (!pathComponents1[pathComponents1.length - 1]) {
    pathComponents1.splice(pathComponents1.length - 1, 1);
  }
  // remove leading empty elements from pathComponents2
  while (!pathComponents2[0]) {
    pathComponents2.splice(0, 1);
  }
  return [...pathComponents1, ...pathComponents2].filter(el => !!el).join('/');
}

/**
 * Extracts script config from CLI arguments
 * @param {object} config - default settings
 */
function parseConfig(config) {
  process.argv.forEach(function(argument, idx) {
    if (idx>1) {
      if (argument.substr(0,2) === '--') {
        // parse options
        let key, value;
        // supplement binary options with a true value
        [key, value] = (argument.search('=') === -1) ? [argument.slice(2), true] : argument.slice(2).split('=');
        config[key] = value;
      } else {
        // non-option is the entry point
        config.entry = argument;
      }
    }
  });
  if (config.verbose) console.log(config);
  if (config.entry) {
    // resolve paths
    config.entry = resolvePath(config.entry);
    config.destination = resolvePath(config.destination, '', '');
    // extract real app root location from entry
    if (config['real-root-is']) {
      config['real-root-is'] = resolvePath(config['real-root-is']);
    } else {
      config['real-root-is'] = config.entry.split('/').slice(0,-1).join('/') + '/';
    }
  }

  if (config.verbose) console.log(config);
  return Promise.resolve(config);
}

function helpUsage() {
  console.log(`bundle-flat is a simple tool to collect all project files into a distribution directory flattening the code base tree structure.
It parses source code starting from entry point, collects files referred to in script and img src attributes and puts those flat into a destination directory. 
Fully qualified URLs are ignored.
If either part of partial url is a file then such part is replaced with contents of the file assuming the file contains a path fragment (a feature from some web servers).
If either URL ends with a slash character or directory name then index.html is assumed as a principal target.

Usage: node bundle-flat <entryPoint> [options...]
  entryPoint - file or path to start with
  --destination=<path> - project files will be collected under <path>
  --entry-root-is=<path> - whenever URL starts with a slash or directory name the <path> is prepended unless empty
  --verbose - log activities; default mode is silent
  --flatten - puts files into destination with a flat structure
  --watch - updates destination whenever source code base files get amended`);
}
