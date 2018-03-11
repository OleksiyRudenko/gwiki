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
})({32:[function(require,module,exports) {
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Utils = {
    merge: function merge() {
        for (var i = 1; i < arguments.length; i++) {
            for (var x in arguments[i]) {
                // Do deep merge if both are non-array objects and if neither is null
                if (arguments[0][x] !== null && arguments[i][x] !== null && _typeof(arguments[0][x]) == 'object' && !(arguments[0][x] instanceof Array) && _typeof(arguments[i][x]) == 'object' && !(arguments[i][x] instanceof Array)) {
                    Utils.merge(arguments[0][x], arguments[i][x]);
                } else {
                    arguments[0][x] = arguments[i][x];
                }
            }
        }
    },

    implements: function _implements(iface, obj) {
        if (typeof iface == 'string') {
            if (typeof Skel.interfaces == 'undefined' || typeof Skel.interfaces[iface] == 'undefined') throw "No interface '" + iface + "' defined! You can define this interface by adding an array with interface methods and property names to the Skel.interfaces hash like so: `Skel.interfaces['" + iface + "'] = [ 'method1', 'method2', 'property1', 'property2', '...' ];`";
            iface = Skel.interfaces[iface];
        } else {
            if ((typeof iface === 'undefined' ? 'undefined' : _typeof(iface)) != 'object' || typeof iface.length == 'undefined') throw "You must pass either an array containing method and property names or the name of a defined interface as the first parameter!";
        }

        if (typeof obj == null || (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) != 'object') return false;

        for (var i = 0; i < iface.length; i++) {
            if (typeof obj[iface[i]] == 'undefined') return false;
        }
        return true;
    },

    makeObservable: function makeObservable(classRef) {
        if (typeof classRef.prototype.addEventListener == 'undefined') {
            classRef.prototype.addEventListener = function (eventName, callback) {
                if (typeof this.eventListeners == 'undefined') this.eventListeners = {};
                if (typeof this.eventListeners[eventName] == 'undefined') this.eventListeners[eventName] = [];
                this.eventListeners[eventName].push(callback);
            };
        } else {
            console.warn('Warning: addEventListener already defined on this class. Not overriding, but you may experience unpredictible results.');
        }

        if (typeof classRef.prototype.removeEventListener == 'undefined') {
            classRef.prototype.removeEventListener = function (eventName, callback) {
                if (typeof this.eventListeners == 'undefined') this.eventListeners = {};
                if (typeof this.eventListeners[eventName] == 'undefined') return true;

                for (var i = 0; i < this.eventListeners[eventName].length; i++) {
                    if (this.eventListeners[eventName][i] === callback) {
                        this.eventListeners[eventName].splice(i, 1);
                        break;
                    }
                }
                return true;
            };
        } else {
            console.warn('Warning: removeEventListener already defined on this class. Not overriding, but you may experience unpredictible results.');
        }

        if (typeof classRef.prototype.dispatchEvent == 'undefined') {
            classRef.prototype.dispatchEvent = function (eventName, props) {
                if (typeof this.eventListeners == 'undefined') this.eventListeners = {};
                if (typeof this.eventListeners[eventName] == 'undefined') return true;

                var e = props || {};
                if (typeof e.target != 'undefined') console.warn('WARNING: You\'ve passed a value ("' + e.target + '") on the restricted key `target` of an event object! The `target` property is always used to expose the object that issued the event. Your value will be overwritten.');
                e.target = this;

                var stopPropagation = false;
                var preventDefault = false;
                e.stopPropagation = function () {
                    stopPropagation = true;
                };
                e.preventDefault = function () {
                    preventDefault = true;
                };

                for (var i = 0; i < this.eventListeners[eventName].length; i++) {
                    this.eventListeners[eventName][i].call(window, e);
                    if (stopPropagation) break;
                }

                return !preventDefault;
            };
        } else {
            console.warn('Warning: dispatchEvent already defined on this class. Not overriding, but you may experience unpredictible results.');
        }
    }
};
},{}]},{},[32])