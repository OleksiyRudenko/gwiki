// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
require = (function (modules, cache, entry) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof require === "function" && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof require === "function" && require;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  // Override the current require with this new one
  return newRequire;
})({36:[function(require,module,exports) {
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

GwikiBridge = function GwikiBridge(opts) {
    Utils.merge(this, {
        api: null,
        options: {
            initTimeout: 8,
            initCheckInterval: .5
        }
    }, opts);
    this.initTimer = 0;
};

GwikiBridge.prototype = Object.create(Object.prototype);
GwikiBridge.interface = ['init', 'signin'];

// Add observable characteristics
Utils.makeObservable(GwikiBridge);

GwikiBridge.prototype.init = function (api, clientId, discoveryDocs, scope, apikey) {
    var t = this;

    this.api = api;

    // Make sure we've got an api client
    if (typeof this.api == 'undefined' || typeof this.api.client == 'undefined') {
        this.dispatchEvent('error', { type: 'noApiClient', message: GwikiBridge.strings['noApiClient'] });
        throw GwikiBridge.strings['errNoApiClient'];
    }

    // Initialize the google api
    if (apikey) this.api.client.setApiKey(apikey);
    this.api.client.init({
        apiKey: apikey,
        clientId: clientId,
        discoveryDocs: discoveryDocs,
        scope: scope
    }).then(function () {
        // When the client is ready, create signinStatus event passthrough and notify initialized
        t.api.auth2.getAuthInstance().isSignedIn.listen(function (signedIn) {
            t.signedIn = signedIn;
            t.dispatchEvent('signinStatusChanged');
        });
        t.signedIn = t.api.auth2.getAuthInstance().isSignedIn.get();
        t.dispatchEvent('init');
        t.dispatchEvent('signinStatusChanged');
    });
};

// Signin
GwikiBridge.prototype.signin = function () {
    this.api.auth2.getAuthInstance().signIn();
};

// Get Items
GwikiBridge.prototype.getItemById = function (id, userParams) {
    var t = this,
        callback;
    var params = { 'fields': 'id,name,mimeType,parents' };
    Utils.merge(params, userParams || {});
    params['fileId'] = id;

    this.api.client.drive.files.get(params).then(function (response) {
        var gwikiItemProps = response.result;
        t.dispatchEvent('getItem', { "gwikiItemProps": gwikiItemProps });
        if (callback) callback(gwikiItemProps);
    });

    return { then: function then(c) {
            callback = c;
        } };
};

// Get Children
GwikiBridge.prototype.getChildrenFor = function (gwikiItem, userParams) {
    var t = this,
        callback;
    var params = {
        'pageSize': 1000,
        'fields': 'files(id, name, mimeType, parents)'
    };
    Utils.merge(params, userParams || {});

    // Sanity check
    if ((typeof gwikiItem === 'undefined' ? 'undefined' : _typeof(gwikiItem)) == 'object') {
        if (!gwikiItem.id) throw "GwikiBridge::getChildFor must receive either an item id (string) or a GwikiItem with an `id` property as its argument. The object you've passed doesn't appear to have an `id` property set.";
        gwikiItem = gwikiItem.id;
    }
    params['q'] = "'" + gwikiItem + "' in parents and trashed = false", this.api.client.drive.files.list(params).then(function (response) {
        var children = response.result.files;
        t.dispatchEvent('getChildren', { "for": gwikiItem, "children": children });
        if (callback) callback(children);
    });

    return { then: function then(c) {
            callback = c;
        } };
};

// Download Content
GwikiBridge.prototype.downloadContent = function (gwikiItem, userParams) {
    var t = this,
        callback;
    var params = { 'alt': 'media' };
    Utils.merge(params, userParams || {});

    if ((typeof gwikiItem === 'undefined' ? 'undefined' : _typeof(gwikiItem)) == 'object') {
        if (!gwikiItem.id) throw "GwikiBridge::downloadContent must receive either an item id (string) or a GwikiItem with an `id` property as its argument. The object you've passed doesn't appear to have an `id` property set.";
        gwikiItem = gwikiItem.id;
    }
    params['fileId'] = gwikiItem;

    this.api.client.drive.files.get(params).then(function (response) {
        if (callback) callback(response.body);
    });

    return { then: function then(c) {
            callback = c;
        } };
};

// Export Content
GwikiBridge.prototype.exportContent = function (gwikiItem, userParams) {
    var t = this,
        callback;
    var params = { 'mimeType': 'text/html' };
    Utils.merge(params, userParams || {});

    if ((typeof gwikiItem === 'undefined' ? 'undefined' : _typeof(gwikiItem)) == 'object') {
        if (!gwikiItem.id) throw "GwikiBridge::exportContent must receive either an item id (string) or a GwikiItem with an `id` property as its argument. The object you've passed doesn't appear to have an `id` property set.";
        gwikiItem = gwikiItem.id;
    }
    params['fileId'] = gwikiItem;

    this.api.client.drive.files.export(params).then(function (response) {
        if (callback) callback(response.body);
    });

    return { then: function then(c) {
            callback = c;
        } };
};

// Strings
GwikiBridge.strings = {
    'errGeneral': 'Sorry, something went wrong :(. Please reload the page to try again.',
    'errNoApiClient': "No API Client was handed to the init function. Usually, you'll call `GwikiBridge::init` on Google's API client `onload` event, which should allow you to pass the `gapi` global variable to `GwikiBridge::init`."
};
},{}]},{},[36])