const fse = require('fs-extra');

console.log('>>>>>> PRE-BUILD CHORES');

const distDir = 'dist';
// const assetsDestDir = 'dist/assets';
const DIRS_TO_CLEAN_UP = [ distDir]; // , assetsDestDir ];

// const assetsSrcDir = 'src/assets';
const ASSETS_TO_COPY = []; // ['city.list.json'];

console.log('=== Cleaning dirs up');

DIRS_TO_CLEAN_UP.forEach(dir => {
  try {
    console.log('--- Cleaning up ' + dir);
fse.emptyDirSync(dir);
console.log('OK');
} catch (err) {
  console.log('ERROR: ' + err);
}
});

console.log('=== Copying files');
ASSETS_TO_COPY.forEach(file => {
  try {
    console.log('--- Copying file ' + file);
fse.copySync(assetsSrcDir + '/' + file, assetsDestDir + '/' + file);
console.log('OK');
} catch (err) {
  console.log('ERROR: ' + err);
}
});

console.log('<<<<<< PRE-BUILD CHORES');
