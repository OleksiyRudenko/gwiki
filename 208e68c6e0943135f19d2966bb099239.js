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
})({33:[function(require,module,exports) {
/**
 * Main library for maintaining data structures necessary for displaying Google Drive hierarchies as
 * wikis.
 *
 * @param Hash opts -- options to override defaults
 *      GwikiObject home - the initial root object
 *
 * TBC....
 */

Gwiki = function Gwiki(opts) {
    Utils.merge(this, {
        home: null,
        currentItem: null,
        navStack: []
    }, opts || {});

    // A queue for storing commands that require bridge, if bridge isn't yet initialized
    this.queue = [];
};

Gwiki.prototype = Object.create(Object.prototype);
Gwiki.interface = ['init', 'setHome', 'setCurrentItem', 'getItemById', 'addEventListener', 'removeEventListener', 'dispatchEvent'];

// Add observable characteristics
Utils.makeObservable(Gwiki);

Gwiki.prototype.init = function (bridge) {
    this.bridge = bridge;

    // Sanity checks on init
    if (!Utils.implements(GwikiBridge.interface, this.bridge)) throw "This library requires a valid Bridge instance. Usually you pass this into the `Gwiki::init` function (this function) when `GwikiUI` is initialized.";

    this.initialized = true;
    this.dispatchEvent('init');
};

Gwiki.prototype.setHome = function (folderId, defaultDoc) {
    var t = this,
        callback;
    var thenGo = { then: function then(c) {
            callback = c;
        } };
    var go = { then: function then(c) {
            c.call(t, t.home);
        } };

    // If home set to null, clear current item, too
    if (!folderId) {
        this.home = null;
        this.currentItem = null;
        this.dispatchEvent('setHome');

        this.navStack = [];
        this.dispatchEvent('updateNavStack');

        return go;
    }

    // If we're setting it to the current home, just exit
    if (this.home && folderId == this.home.id) return go;

    // Otherwise, change home
    this.getItemById(folderId).then(function (home) {
        t.home = home;
        t.home.isHome = true;
        t.home.getChildren().then(function (children) {
            // Set current item to defaultDoc or home
            if (!defaultDoc) defaultDoc = t.home;
            t.setCurrentItem(defaultDoc, false);

            // Tell listeners that we've set home
            t.dispatchEvent('setHome');
            if (callback) callback.call(t, t.home);
        });
    });

    return thenGo;
};

Gwiki.prototype.setCurrentItem = function (item, navStackDirect) {
    var t = this,
        callback;
    var thenGo = { then: function then(c) {
            callback = c;
        } };
    var go = { then: function then(c) {
            c.call(t, t.currentItem);
        } };

    // Should default to appending to navStack, rather than resetting
    if (typeof navStackDirect == 'undefined') navStackDirect = true;

    // If we're already on this item, exit
    if (this.currentItem) {
        if (typeof item == 'string') {
            if (item == this.currentItem.id) return go;
        } else if (item.id == this.currentItem.id) return go;
    }

    // If item is a string, we need to get an object from it and try again
    if (typeof item == 'string') {
        // Get the item, then...
        this.getItemById(item).then(function (item) {
            // use it to call `setCurrentItem` again, then..
            // TODO: Check to make sure passing an undefined `navStackDirect` retains undefined status
            t.setCurrentItem(item, navStackDirect).then(function (item2) {
                // Call the original callback
                if (callback) callback.call(t, t.currentItem);
            });
        });
        return thenGo;
    }

    // If this is a folder whose children we haven't gotten yet...
    if (!item.isTerminus && item.children === null) {
        // get them, then...
        item.getChildren().then(function () {
            // Try again, then...
            t.setCurrentItem(item, navStackDirect).then(function (item2) {
                // Call the original callback
                if (callback) callback.call(t, t.currentItem);
            });
        });
        return thenGo;
    }

    // If we want to do a simple push/pop on the navStack, do it now. We've got a complete
    // object, though perhaps not a final object (if it's a folder with no default content).
    if (navStackDirect) this.updateNavStack(item, navStackDirect);

    // If we don't have a bodySrc, we're in a folder with no default content. Go to the next item, if there is one.
    if (item.bodySrc === null) {
        // If we're in an empty folder, just set the item. Nothing we can do.
        if (item.children.length == 0) {
            this.currentItem = item;
            this.rectifyTree(!navStackDirect);
            this.dispatchEvent('setCurrentItem');
            return go;

            // Otherwise, select the first child
        } else {
            this.setCurrentItem(item.children[0], navStackDirect).then(function (item2) {
                // Call the original callback
                if (callback) callback.call(t, t.currentItem);
            });
            return thenGo;
        }
    }

    // Now we know we've got valid content, so get it
    this.currentItem = item;
    item.getBody().then(function () {
        // Everything's set; let the world know we're done setting the current item
        t.rectifyTree(!navStackDirect);
        t.dispatchEvent('setCurrentItem');
        if (callback) callback.call(t, t.currentItem);
    });
    return thenGo;
};

Gwiki.prototype.rectifyTree = function (updateNavStack, node) {
    var t = this,
        entryPoint = false,
        callback;
    var go = { then: function then(c) {
            c.call(t, t.home);
        } };
    var thenGo = { then: function then(c) {
            callback = c;
        } };
    var finishRectification = function finishRectification() {
        if (entryPoint) {
            if (updateNavStack) t.updateNavStack(t.currentItem);
            this.dispatchEvent('rectifyTree');
        }
    };

    if (!node) {
        node = this.currentItem;
        entryPoint = true;
    }

    // If we got up to the home folder, then the job is done
    if (node.id == this.home.id || !node.parents) {
        this.dispatchEvent('rectifyTree');
        return go;
    }

    var p = node.parents[0];

    // If parent isn't yet instantiated, instantiate and try again
    if (!(p instanceof GwikiItem)) {
        node.getParents().then(function () {
            t.rectifyTree(updateNavStack, node).then(function () {
                if (callback) callback(t.home);
            });
        });
        return thenGo;
    }

    // If somehow we got up to the root, just abort
    if (!p) {
        this.dispatchEvent('rectifyTree');
        return go;
    }

    // If parent needs updating, update and try again
    if (!p.name) {
        p.update().then(function () {
            p.getChildren().then(function () {
                t.rectifyTree(updateNavStack, p).then(finishRectification);
            });
        });
        return thenGo;
    } else {
        // If we haven't build out this parent's child collection, build it and try again
        if (p.children === null) {
            p.getChildren().then(function () {
                t.rectifyTree(updateNavStack, p).then(finishRectification);
            });
            return thenGo;

            // Otherwise, we're finally good, this one means we're done (kind of)
        } else {
            t.rectifyTree(updateNavStack, p).then(finishRectification);
            return thenGo;
        }
    }
};

Gwiki.prototype.updateNavStack = function (item, direct) {
    // If we want to directly manipulate navstack, just push and pop accordingly
    if (direct) {
        // Back it off, if necessary
        for (var i = 0; i < this.navStack.length; i++) {
            if (this.navStack[i].id == item.id) break;
        }
        while (this.navStack.length > i && this.navStack.lenth != 0) {
            this.navStack.pop();
        } // Then push
        this.navStack.push(item);
    } else {
        // If we're rebuilding the nav stack, then we can assume we're doing it from
        // the currently available data. All we have to do is map the descendency tree.
        this.navStack = [];
        while (!item.isHome) {
            this.navStack.unshift(item);
            item = item.parents[0];
        }
        this.navStack.unshift(item);
    }

    // Notify listeners
    this.dispatchEvent('updateNavStack');
};

// Object getters

Gwiki.prototype.getItemById = function (id) {
    var t = this,
        thenCallback;
    this.bridge.getItemById(id).then(function (itemProps) {
        itemProps.bridge = t.bridge;
        // TODO: Use factory to instantiate
        thenCallback.call(t, new GwikiItem(itemProps));
    });

    return { then: function then(callback) {
            thenCallback = callback;
        } };
};
},{}]},{},[33])