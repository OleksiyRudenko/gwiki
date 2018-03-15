# Simple Bundler

Bundles VanillaJS-backed code base to a bundle that can be
deployed with any web server able to serve static files.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
#### Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
  - [Bonus features](#bonus-features)
  - [What `bundle-flat` doesn't do](#what-bundle-flat-doesnt-do)
- [Installation](#installation)
  - [Pre-requisites](#pre-requisites)
  - [Tuning Things Up](#tuning-things-up)
    - [`.gitignore`](#gitignore)
    - [Dependencies](#dependencies)
    - [Commands](#commands)
- [Usage](#usage)
  - [Options](#options)
  - [How it works](#how-it-works)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## The Problem

In the simplest case you produce a VanillaJS code that
requires no transpilation or anything alike and can be directly
served from static web server to any browser.

But you will want to employ a bundler whenever either of the below
is true:
 - app entry point (e.g. `index.html`) is located under a sub-directory
   (e.g. `src/`) and you want to have it at the root upon deployment
 - auxiliary code base or assets will not be accessible if not located
   under the directory where the entry point is
 - external modules employed and managed with some package manager
   (e.g. `npm` or `yarn`)
 - not all files in the project are required to run the app

The problem, which comes along with the most of the bundlers
like [`webpack`](https://webpack.js.org/) or
[`parcelJS`](https://parceljs.org/) is that your code will be
supplemented with some extra code, which you may not like to have.

[_-TOC-_](#table-of-contents)

## The Solution

`bundle-flat` will
 1. collect required local files (`.js`, `.html`, `.css`,
    and imagery) from `src` and `href` attribute of `script`, `link`, and
    `img` tags
 2. copy the collected files into a distribution directory (e.g. `dist/`)
 3. replace local files references in `src` so that those
    will refer to `dist/*`

### Bonus features
 1. `bundle-flat` understands symlink files (Linux symlink files
    under Windows as well), which may not be supported by some
    of the web servers (e.g. the one that serves files
    for GitHub Pages) and translates every file path into real path
 2. `bundle-flat` employs
    [`nodemon`](https://www.npmjs.com/package/nodemon)
    to rebuild distribution bundle whenever you make any changes
    to source code base to make your development life easier
 3. `package.json` offers an extra command to push distribution
    bundle to GitHub Pages
    employing [`push-dir`](https://www.npmjs.com/package/push-dir).
    This is optional.

### What `bundle-flat` doesn't do

`bundle-flat` doesn't parse `import` or `require` instructions
from `*.js`. You will have to switch to a more advanced bundler
to support these.

[_-TOC-_](#table-of-contents)

## Installation

### Pre-requisites

Commands below refer to `yarn` package manager. You may
[install `yarn`](https://yarnpkg.com/lang/en/docs/install/) or
translate `yarn` commands to e.g. `npm` commands:
 * `yarn install` => `npm install`
 * `yarn add <package> --dev` => `npm install <package> --save-dev`
 * `yarn global add <package>` => `npm install <package> --global`

To benefit from publishing distribution bundle to GitHub pages run
`yarn global add push-dir`

Decide on what directory will contain distribution bundle. You will
not want keeping it under version control. Here we assume that `dist/`
will contain distribution bundle.

[_-TOC-_](#table-of-contents)

### Tuning Things Up

#### `.gitignore`

Your project `.gitignore` must contain `/dist` and `/node_modules`

#### Dependencies

If your project already contains `package.json` then
copy Dev Dependencies from `bundle-flat`'s `package.json`
to the project's `package.json`.

Run `yarn install` to update local modules storage.

#### Commands

If your project already contains `package.json` then
copy `push-gh-pages` (optional), `bundle-flat` and
`bundle-flat-watch` script commands from `bundle-flat`'s
`package.json` to the project's `package.json`.

[_-TOC-_](#table-of-contents)

## Usage

Run
 * `node bundle-flat` to bundle project files into distribution
   directory
 * `node push-gh-pages` to publish distribution bundle with
   GitHub Pages
 * `node bundle-flat-watch` bundles project files whenever you make
   any changes to the source code base

### Options

You may want to change `bundle-flat` options.

First option is the app's entry point (`index.html` added if no
particular file specified).

The following settings are all optional.

`--destination=<path>` - directory to put bundled code under;
default value is `dist/`.

`--real-root-is=<path>` - what is considered to be app
root; default value is a directory entry point located in.

`--flatten` - do not preserve source code base directory
structure; by default source code base directories mapped to
distribution directory.

`--verbose` - activities logged verbosely

`--watch` - updates distribution bundle upon every source
code base amendment.

[_-TOC-_](#table-of-contents)

### How it works

Let's assume the following project code base structure

```
--- entry/
 |  |- page-about/
 |  |  \- index.html
 |  |
 |  |- assets       -- symlink file, contains '../src/'
 |  |- index.html
 |  \- vendors      -- symlink file, contains '../vendor/'
 |
 |- src/
 |  |- images/
 |  |  |- button.png
 |  |  \- logo.png
 |  |
 |  |- app.js
 |  |- base.css
 |  \- util.js
 |
 |- vendor/
 |  |- composer/
 |  |  \- <package files>
 |  \- jmcmanus/
 |     \- pagedown-extra/
 |        |- demo/
 |        |  \- <more files>
 |        |- pagedown/
 |        |  \- <more files>
 |        |- spec/
 |        |  \- <more files>
 |        |- Markdown.Extra.js -- the only file used by app from the entire package
 |        |- node-pagedown-extra.js
 |        \- <more files>
 |
 |- bundle-flat.js
 |- bundle-flat.md
 |- composer.json
 |- composer.lock
 |- package.json
 |- public_html     -- symlink file, contains 'entry/'
 |- README.md
 \- yarn.lock
```

We want to distribute only files from under `entry/` and `src/` and
only certain files from under `vendor/`

Take a special note of `public_html`, `entry/assets`, and
`entry/vendors`. These are actually symlinks and whenever path
contains `public_html` or `assets` or `vendors` this part of path
is replaced with the contents of symlink file.

Let's take a look at some files:

```
----------------
entry/index.html
----------------
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=2.0">
    <title>My App</title>
    <link rel="stylesheet" href="//use.fontawesome.com/releases/v5.0.4/css/all.css" />
    <link type="text/css" rel="stylesheet" href="/assets/base.css">
    <script type="text/javascript" src="/vendor/jmcmanus/pagedown-extra/Markdown.Extra.js"></script>
    <script type="text/javascript" src="/assets/util.js"></script>
</head>
<body>
    <img src="/assets/images/logo.png">
    <a href="page-about/index.html">About</a>
    <div id="some-div"></div>
    <script type="text/javascript" src="https://apis.google.com/js/api.js"></script>
    <script type="text/javascript" src="/assets/app.js"></script>
</body>
</html>

----------------------------
entry/pages-about/index.html
----------------------------
<nothing special>

----------
src/app.js
----------
<nothing special; no any 'import' or 'require'>

------------
src/Utils.js
------------
<some code>
document.getElementById('some-div').innerHTML =
 '<img src="/assets/images/button.png">';
<some more code>
```

Running `bundle-flat public_html/` will result in the following
structure under `dist/`.

```
dist/
|- page-about/
|  \- index.html
|
|- src/
|  |- images/
|  |  |- button.png
|  |  \- logo.png
|  |
|  |- app.js
|  |- base.css
|  \- util.js
|
|- vendor/
|  \- jmcmanus/
|     \- pagedown-extra/
|        \- Markdown.Extra.js
|
\- index.html
```

That's what we basically want. `bundle-flat` has parsed files
recursively starting from the entry point.
The contents of `dist/` will then be deployed to a web server.

References to local project files will also be substituted so
that they take new structure into consideration.

Below is path mapping for the example above.

```
bundle-flat:
    public_html/                                       -- ./entry/index.html
entry/index.html:
    //use.fontawesome.com/releases/v5.0.4/css/all.css  -- <no change>
    /assets/base.css                                   -- ./src/base.css
    /vendor/jmcmanus/pagedown-extra/Markdown.Extra.js  -- ./vendor/jmcmanus/pagedown-extra/Markdown.Extra.js
    /assets/util.js                                    -- ./src/utils.js
    /assets/images/logo.png                            -- ./src/images/logo.png
    page-about/index.html                              -- ./page-about/index.html
    https://apis.google.com/js/api.js                  -- <no change>
    /assets/app.js                                     -- ./src/app.js
src/util.js:
    /assets/images/button.png                          -- ./src/images/button.png
```

[_-TOC-_](#table-of-contents)
