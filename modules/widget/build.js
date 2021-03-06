'use strict';

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const camelCase = require('camelcase');
const ngc = require('@angular/compiler-cli/src/main').main;
const rollup = require('rollup');
const uglify = require('rollup-plugin-uglify');
const sourcemaps = require('rollup-plugin-sourcemaps');
const execa = require('execa');
const rollupGlobals = require('../../tools/rollup-globals');
const del = require('del');
const inlineResources = require('./../../tools/inline-resources');
const sass = require('node-sass');

const libNameWithScope = require('./package.json').name;
const libName = libNameWithScope.slice(libNameWithScope.indexOf('/') + 1);
const rootFolder = path.join(__dirname);
const compilationFolder = path.join(rootFolder, 'out-tsc');
const srcFolder = path.join(rootFolder, 'src/lib');
const distFolder = path.join(rootFolder, 'dist');
const srcAssetsFolder = path.join(rootFolder, 'src/assets');
const distAssetsFolder = path.join(distFolder, 'assets');
const tempLibFolder = path.join(compilationFolder, 'lib');
const es5OutputFolder = path.join(compilationFolder, 'lib-es5');
const es2015OutputFolder = path.join(compilationFolder, 'lib-es2015');

const build = async function () {

  await del(compilationFolder);

  await  _relativeCopy(`**/*`, srcFolder, tempLibFolder);
  await inlineResources(tempLibFolder);
  console.log('inline succeeded.');


  sass.renderSync({
    file: path.join(srcAssetsFolder, 'styles.scss'),
    outFile: path.join('styles.css')
  });

  console.log('sass assets compiled');


  await ngc({project: `${tempLibFolder}/tsconfig.json`});
  console.log('ES2015 compilation succeeded.');

  await ngc({project: `${tempLibFolder}/tsconfig.es5.json`});
  console.log('ES5 compilation succeeded.');

  await _relativeCopy('**/*.d.ts', es2015OutputFolder, distFolder);
  _relativeCopy('**/*.metadata.json', es2015OutputFolder, distFolder);
  console.log('Typings and metadata copy succeeded.');

  // Base configuration.
  const es5Entry = path.join(es5OutputFolder, `${libName}.js`);
  const es2015Entry = path.join(es2015OutputFolder, `${libName}.js`);
  const rollupBaseConfig = {
    moduleName: camelCase(libName),
    sourceMap: true,
    // ATTENTION:
    // Add any dependency or peer dependency your library to `globals` and `external`.
    // This is required for UMD bundle users.
    globals: Object.assign(rollupGlobals),
    external: [
      ...Object.keys(rollupGlobals)
    ],
    plugins: [
      sourcemaps()
    ],
    onwarn: (warning) => {
      // Suppress this error message... there are hundreds of them. Angular team says to ignore it.
      // https://github.com/rollup/rollup/wiki/Troubleshooting#this-is-undefined
      if (warning.code === 'THIS_IS_UNDEFINED') return;
      console.error(warning.message);
    },
  };

  // UMD bundle.
  const umdConfig = Object.assign({}, rollupBaseConfig, {
    entry: es5Entry,
    dest: path.join(distFolder, `${libName}.umd.js`),
    format: 'umd',
  });

  // Minified UMD bundle.
  const minifiedUmdConfig = Object.assign({}, rollupBaseConfig, {
    entry: es5Entry,
    dest: path.join(distFolder, `${libName}.umd.min.js`),
    format: 'umd',
    plugins: rollupBaseConfig.plugins.concat([uglify({})])
  });

  // ESM+ES5 flat module bundle.
  const fesm5config = Object.assign({}, rollupBaseConfig, {
    entry: es5Entry,
    dest: path.join(distFolder, `${libName}.es5.js`),
    format: 'es'
  });

  // ESM+ES2015 flat module bundle.
  const fesm2015config = Object.assign({}, rollupBaseConfig, {
    entry: es2015Entry,
    dest: path.join(distFolder, `${libName}.es2015.js`),
    format: 'es'
  });

  await Promise.all([
    umdConfig,
    minifiedUmdConfig,
    fesm5config,
    fesm2015config
  ].map(cfg => rollup.rollup(cfg).then(bundle => bundle.write(cfg))));

  console.log('All bundles generated successfully.');

  await _relativeCopy('package.json', rootFolder, distFolder);

  console.log('Package files copy succeeded.');

  await del(compilationFolder);

};


// Copy files maintaining relative paths.
function _relativeCopy(fileGlob, from, to) {
  return new Promise((resolve, reject) => {
    glob(fileGlob, {cwd: from, nodir: true}, (err, files) => {
      if (err != null) {
        reject(err);
      }
      files.forEach(file => {
        const origin = path.join(from, file);
        const dest = path.join(to, file);
        const data = fs.readFileSync(origin, 'utf-8');
        _recursiveMkDir(path.dirname(dest));
        fs.writeFileSync(dest, data);
        resolve();
      })
    })
  });
}

// Recursively create a dir.
function _recursiveMkDir(dir) {
  if (!fs.existsSync(dir)) {
    _recursiveMkDir(path.dirname(dir));
    fs.mkdirSync(dir);
  }
}


if (process.argv.indexOf('run') >= 0) {

  build().then(() => console.log('build successful')).catch(err => {
    console.log('build err');
    console.log(err.message)
  });


}

module.exports = build;

