// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
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

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
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
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  return newRequire;
})({"utils.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function trace(clientId, title, value) {
  var prefix = '';

  if (window.performance) {
    prefix = '[' + (window.performance.now() / 1000).toFixed(3) + ']';
  }

  if (clientId) {
    prefix = prefix + '[' + clientId + ']';
  }

  if (isEdge()) {
    console.log(prefix + ' ' + title + '\n', value); // eslint-disable-line
  } else {
    console.info(prefix + ' ' + title + '\n', value); // eslint-disable-line
  }
}

exports.trace = trace;

function browser() {
  var ua = window.navigator.userAgent.toLocaleLowerCase();

  if (ua.indexOf('edge') !== -1) {
    return 'edge';
  } else if (ua.indexOf('chrome') !== -1 && ua.indexOf('edge') === -1) {
    return 'chrome';
  } else if (ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1) {
    return 'safari';
  } else if (ua.indexOf('opera') !== -1) {
    return 'opera';
  } else if (ua.indexOf('firefox') !== -1) {
    return 'firefox';
  }

  return;
}

function isPlanB() {
  return browser() === 'chrome' || browser() === 'safari';
}

function isUnifiedChrome() {
  if (browser() !== 'chrome') {
    return false;
  }

  var ua = window.navigator.userAgent.toLocaleLowerCase();
  var splitedUserAgent = /chrome\/([\d.]+)/.exec(ua);

  if (!splitedUserAgent || splitedUserAgent.length < 2) {
    return false;
  }

  return 71 <= parseInt(splitedUserAgent[1]);
}

exports.isUnifiedChrome = isUnifiedChrome;

function isUnifiedSafari() {
  if (!isSafari()) {
    return false;
  }

  var appVersion = window.navigator.appVersion.toLowerCase();
  var version = /version\/([\d.]+)/.exec(appVersion).pop();
  return 12.0 < parseFloat(version);
}

exports.isUnifiedSafari = isUnifiedSafari;

function isEdge() {
  return browser() === 'edge';
}

exports.isEdge = isEdge;

function isSafari() {
  return browser() === 'safari';
}

exports.isSafari = isSafari;

function isChrome() {
  return browser() === 'chrome';
}

exports.isChrome = isChrome;

function replaceAnswerSdp(sdp) {
  var ssrcPattern = new RegExp(/m=video[\s\S]*?(a=ssrc:(\d+)\scname:.+\r\n(a=ssrc:\2\smsid:.+\r\na=ssrc:\2\smslabel:.+\r\na=ssrc:\2\slabel:.+\r\n)?)/); // eslint-disable-line

  var found = sdp.match(ssrcPattern);

  if (!found) {
    return sdp;
  }

  var ssrcAttributes = found[1];
  ssrcPattern = found[1];
  var ssrcId = parseInt(found[2]);
  var ssrcIdPattern = new RegExp(ssrcId.toString(), 'g');
  var ssrcGroup = ['a=ssrc-group:SIM'];
  var ssrcAttributeList = [];

  for (var i = 0; i < 3; i += 1) {
    ssrcGroup.push((ssrcId + i).toString());
    ssrcAttributeList.push(ssrcAttributes.replace(ssrcIdPattern, (ssrcId + i).toString()));
  }

  return sdp.replace(ssrcPattern, [ssrcGroup.join(' '), '\r\n', ssrcAttributeList.join('')].join(''));
}

exports.replaceAnswerSdp = replaceAnswerSdp;

function createSignalingMessage(offerSDP, role, channelId, metadata, options) {
  var message = {
    type: 'connect',
    role: role,
    channel_id: channelId,
    metadata: metadata,
    sdp: offerSDP,
    userAgent: window.navigator.userAgent,
    audio: true,
    video: true
  };
  Object.keys(message).forEach(function (key) {
    if (message[key] === undefined) {
      message[key] = null;
    }
  });

  if ('multistream' in options && options.multistream === true) {
    // multistream
    message.multistream = true;

    if (!isUnifiedChrome() && !isUnifiedSafari() && isPlanB()) {
      message.plan_b = true;
    } // spotlight


    if ('spotlight' in options) {
      message.spotlight = options.spotlight;
    }
  } else if ('simulcast' in options || 'simulcastQuality' in options) {
    if (!(isUnifiedSafari() || isChrome())) {
      throw new Error('Simulcast can not be used with this browse be used with this browserr');
    } // simulcast


    if ('simulcast' in options && options.simulcast === true) {
      message.simulcast = true;
    }

    var simalcastQualities = ['low', 'middle', 'high'];

    if ('simulcastQuality' in options && 0 <= simalcastQualities.indexOf(options.simulcastQuality)) {
      message.simulcast = {
        quality: options.simulcastQuality
      };
    }
  } // parse options


  var audioPropertyKeys = ['audioCodecType', 'audioBitRate'];
  var videoPropertyKeys = ['videoCodecType', 'videoBitRate'];
  var copyOptions = Object.assign({}, options);
  Object.keys(copyOptions).forEach(function (key) {
    if (key === 'audio' && typeof copyOptions[key] === 'boolean') return;
    if (key === 'video' && typeof copyOptions[key] === 'boolean') return;
    if (0 <= audioPropertyKeys.indexOf(key) && copyOptions[key] !== null) return;
    if (0 <= videoPropertyKeys.indexOf(key) && copyOptions[key] !== null) return;
    delete copyOptions[key];
  });

  if ('audio' in copyOptions) {
    message.audio = copyOptions.audio;
  }

  var hasAudioProperty = Object.keys(copyOptions).some(function (key) {
    return 0 <= audioPropertyKeys.indexOf(key);
  });

  if (message.audio && hasAudioProperty) {
    message.audio = {};

    if ('audioCodecType' in copyOptions) {
      message.audio['codec_type'] = copyOptions.audioCodecType;
    }

    if ('audioBitRate' in copyOptions) {
      message.audio['bit_rate'] = copyOptions.audioBitRate;
    }
  }

  if ('video' in copyOptions) {
    message.video = copyOptions.video;
  }

  var hasVideoProperty = Object.keys(copyOptions).some(function (key) {
    return 0 <= videoPropertyKeys.indexOf(key);
  });

  if (message.video && hasVideoProperty) {
    message.video = {};

    if ('videoCodecType' in copyOptions) {
      message.video['codec_type'] = copyOptions.videoCodecType;
    }

    if ('videoBitRate' in copyOptions) {
      message.video['bit_rate'] = copyOptions.videoBitRate;
    }
  }

  return message;
}

exports.createSignalingMessage = createSignalingMessage;
},{}],"../node_modules/parcel/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "38501" + '/');

  ws.onmessage = function (event) {
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      console.clear();
      data.assets.forEach(function (asset) {
        hmrApply(global.parcelRequire, asset);
      });
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          hmrAccept(global.parcelRequire, asset.id);
        }
      });
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAccept(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAccept(bundle.parent, id);
  }

  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAccept(global.parcelRequire, id);
  });
}
},{}]},{},["../node_modules/parcel/src/builtins/hmr-runtime.js","utils.ts"], null)
//# sourceMappingURL=/utils.map