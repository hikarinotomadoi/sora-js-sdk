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
},{}],"connection/base.ts":[function(require,module,exports) {
"use strict";

var __assign = this && this.__assign || function () {
  __assign = Object.assign || function (t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];

      for (var p in s) {
        if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
      }
    }

    return t;
  };

  return __assign.apply(this, arguments);
};

var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }

    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }

    function step(result) {
      result.done ? resolve(result.value) : new P(function (resolve) {
        resolve(result.value);
      }).then(fulfilled, rejected);
    }

    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};

var __generator = this && this.__generator || function (thisArg, body) {
  var _ = {
    label: 0,
    sent: function sent() {
      if (t[0] & 1) throw t[1];
      return t[1];
    },
    trys: [],
    ops: []
  },
      f,
      y,
      t,
      g;
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;

  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }

  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");

    while (_) {
      try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
        if (y = 0, t) op = [op[0] & 2, t.value];

        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;

          case 4:
            _.label++;
            return {
              value: op[1],
              done: false
            };

          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;

          case 7:
            op = _.ops.pop();

            _.trys.pop();

            continue;

          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }

            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }

            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }

            if (t && _.label < t[2]) {
              _.label = t[2];

              _.ops.push(op);

              break;
            }

            if (t[2]) _.ops.pop();

            _.trys.pop();

            continue;
        }

        op = body.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
    }

    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

var utils_1 = require("../utils");

var ConnectionBase =
/** @class */
function () {
  function ConnectionBase(signalingUrl, channelId, metadata, options, debug) {
    var _this = this;

    this.disconnect = function () {
      _this.clientId = null;
      _this.authMetadata = null;
      _this.remoteClientIds = [];
      var closeStream = new Promise(function (resolve, _) {
        if (!_this.stream) return resolve();

        _this.stream.getTracks().forEach(function (t) {
          t.stop();
        });

        _this.stream = null;
        return resolve();
      });
      var closeWebSocket = new Promise(function (resolve, reject) {
        if (!_this.ws) return resolve();

        _this.ws.onclose = function () {};

        var counter = 5;
        var timer_id = setInterval(function () {
          if (!_this.ws) {
            clearInterval(timer_id);
            return reject('WebSocket Closing Error');
          }

          if (_this.ws.readyState === 3) {
            _this.ws = null;
            clearInterval(timer_id);
            return resolve();
          }

          --counter;

          if (counter < 0) {
            clearInterval(timer_id);
            return reject('WebSocket Closing Error');
          }
        }, 1000);

        _this.ws.close();
      });
      var closePeerConnection = new Promise(function (resolve, reject) {
        // Safari は signalingState が常に stable のため個別に処理する
        if (utils_1.isSafari() && _this.pc) {
          _this.pc.oniceconnectionstatechange = null;

          _this.pc.close();

          _this.pc = null;
          return resolve();
        }

        if (!_this.pc || _this.pc.signalingState === 'closed') return resolve();
        var counter = 5;
        var timer_id = setInterval(function () {
          if (!_this.pc) {
            clearInterval(timer_id);
            return reject('PeerConnection Closing Error');
          }

          if (_this.pc.signalingState === 'closed') {
            clearInterval(timer_id);
            _this.pc.oniceconnectionstatechange = null;
            _this.pc = null;
            return resolve();
          }

          --counter;

          if (counter < 0) {
            clearInterval(timer_id);
            return reject('PeerConnection Closing Error');
          }
        }, 1000);

        _this.pc.close();
      });
      return Promise.all([closeStream, closeWebSocket, closePeerConnection]);
    };

    this.createAnswer = function () {
      return __awaiter(_this, void 0, void 0, function () {
        var sessionDescription;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [4
              /*yield*/
              , this.pc.createAnswer()];

            case 1:
              sessionDescription = _a.sent();

              if (this.options.simulcast) {
                sessionDescription.sdp = utils_1.replaceAnswerSdp(sessionDescription.sdp);
              }

              return [2
              /*return*/
              , this.pc.setLocalDescription(sessionDescription)];
          }
        });
      });
    };

    this.sendUpdateAnswer = function () {
      _this.trace('ANSWER SDP', _this.pc.localDescription.sdp);

      _this.ws.send(JSON.stringify({
        type: 'update',
        sdp: _this.pc.localDescription.sdp
      }));

      return;
    };

    this.channelId = channelId;
    this.metadata = metadata;
    this.signalingUrl = signalingUrl;
    this.options = options;
    this.debug = debug;
    this.clientId = null;
    this.remoteClientIds = [];
    this.stream = null;
    this.role = null;
    this.ws = null;
    this.pc = null;
    this.callbacks = {
      disconnect: function disconnect() {},
      push: function push() {},
      addstream: function addstream() {},
      removestream: function removestream() {},
      notify: function notify() {},
      log: function log() {}
    };
    this.authMetadata = null;
  }

  ConnectionBase.prototype.on = function (kind, callback) {
    if (kind in this.callbacks) {
      this.callbacks[kind] = callback;
    }
  };

  ConnectionBase.prototype.signaling = function (offer) {
    var _this = this;

    this.trace('CREATE OFFER SDP', offer);
    return new Promise(function (resolve, reject) {
      var signalingMessage = utils_1.createSignalingMessage(offer.sdp, _this.role, _this.channelId, _this.metadata, _this.options);

      if (_this.ws === null) {
        _this.ws = new WebSocket(_this.signalingUrl);
      }

      _this.ws.onclose = function (e) {
        reject(e);
      };

      _this.ws.onopen = function () {
        _this.trace('SIGNALING CONNECT MESSAGE', signalingMessage);

        _this.ws.send(JSON.stringify(signalingMessage));
      };

      _this.ws.onmessage = function (event) {
        var data = JSON.parse(event.data);

        if (data.type == 'offer') {
          _this.clientId = data.client_id;

          _this.ws.onclose = function (e) {
            _this.disconnect().then(function () {
              _this.callbacks.disconnect(e);
            });
          };

          _this.ws.onerror = null;

          if ('metadata' in data) {
            _this.authMetadata = data.metadata;
          }

          _this.trace('SIGNALING OFFER MESSAGE', data);

          _this.trace('OFFER SDP', data.sdp);

          resolve(data);
        } else if (data.type == 'update') {
          _this.trace('UPDATE SDP', data.sdp);

          _this.update(data);
        } else if (data.type == 'ping') {
          _this.ws.send(JSON.stringify({
            type: 'pong'
          }));
        } else if (data.type == 'push') {
          _this.callbacks.push(data);
        } else if (data.type == 'notify') {
          _this.callbacks.notify(data);
        }
      };
    });
  };

  ConnectionBase.prototype.createOffer = function () {
    return __awaiter(this, void 0, void 0, function () {
      var config, pc, offer, offer_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            config = {
              iceServers: []
            };

            if (utils_1.isUnifiedChrome()) {
              config = __assign({}, config, {
                sdpSemantics: 'unified-plan'
              });
            }

            pc = new RTCPeerConnection(config);
            if (!utils_1.isSafari()) return [3
            /*break*/
            , 2];
            pc.addTransceiver('video').direction = 'recvonly';
            pc.addTransceiver('audio').direction = 'recvonly';
            return [4
            /*yield*/
            , pc.createOffer()];

          case 1:
            offer = _a.sent();
            pc.close();
            return [2
            /*return*/
            , Promise.resolve(offer)];

          case 2:
            return [4
            /*yield*/
            , pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true
            })];

          case 3:
            offer_1 = _a.sent();
            pc.close();
            return [2
            /*return*/
            , Promise.resolve(offer_1)];
        }
      });
    });
  };

  ConnectionBase.prototype.connectPeerConnection = function (_message) {
    return __awaiter(this, void 0, void 0, function () {
      var message, certificate;

      var _this = this;

      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            message = __assign({}, _message);

            if (!message.config) {
              message.config = {};
            }

            if (!(RTCPeerConnection.generateCertificate === undefined)) return [3
            /*break*/
            , 1];

            if (utils_1.isUnifiedChrome()) {
              message.config = __assign({}, message.config, {
                sdpSemantics: 'unified-plan'
              });
            }

            this.trace('PEER CONNECTION CONFIG', message.config);
            this.pc = new RTCPeerConnection(message.config);

            this.pc.oniceconnectionstatechange = function (_) {
              _this.trace('ONICECONNECTIONSTATECHANGE ICECONNECTIONSTATE', _this.pc.iceConnectionState);
            };

            return [2
            /*return*/
            , Promise.resolve(message)];

          case 1:
            return [4
            /*yield*/
            , RTCPeerConnection.generateCertificate({
              name: 'ECDSA',
              namedCurve: 'P-256'
            })];

          case 2:
            certificate = _a.sent();
            message.config.certificates = [certificate];

            if (utils_1.isUnifiedChrome()) {
              message.config = __assign({}, message.config, {
                sdpSemantics: 'unified-plan'
              });
            }

            this.trace('PEER CONNECTION CONFIG', message.config);
            this.pc = new RTCPeerConnection(message.config);

            this.pc.oniceconnectionstatechange = function (_) {
              _this.trace('ONICECONNECTIONSTATECHANGE ICECONNECTIONSTATE', _this.pc.iceConnectionState);
            };

            return [2
            /*return*/
            , message];
        }
      });
    });
  };

  ConnectionBase.prototype.setRemoteDescription = function (message) {
    return this.pc.setRemoteDescription(new RTCSessionDescription({
      type: 'offer',
      sdp: message.sdp
    }));
  };

  ConnectionBase.prototype.sendAnswer = function () {
    this.trace('ANSWER SDP', this.pc.localDescription.sdp);
    this.ws.send(JSON.stringify({
      type: 'answer',
      sdp: this.pc.localDescription.sdp
    }));
    return;
  };

  ConnectionBase.prototype.onIceCandidate = function () {
    var _this = this;

    return new Promise(function (resolve, reject) {
      var timerId = setInterval(function () {
        if (_this.pc === null) {
          clearInterval(timerId);
          var error = new Error();
          error.message = 'ICECANDIDATE TIMEOUT';
          reject(error);
        } else if (_this.pc && _this.pc.iceConnectionState === 'connected') {
          clearInterval(timerId);
          resolve();
        }
      }, 100);

      _this.pc.onicecandidate = function (event) {
        _this.trace('ONICECANDIDATE ICEGATHERINGSTATE', _this.pc.iceGatheringState);

        if (event.candidate === null) {
          clearInterval(timerId);
          resolve();
        } else {
          var message = event.candidate.toJSON();
          message.type = 'candidate';

          _this.trace('ONICECANDIDATE CANDIDATE MESSAGE', message);

          _this.ws.send(JSON.stringify(message));
        }
      };
    });
  };

  ConnectionBase.prototype.update = function (message) {
    return this.setRemoteDescription(message);
  };

  ConnectionBase.prototype.trace = function (title, message) {
    this.callbacks.log(title, message);

    if (!this.debug) {
      return;
    }

    utils_1.trace(this.clientId, title, message);
  };

  return ConnectionBase;
}();

exports.default = ConnectionBase;
},{"../utils":"utils.ts"}],"connection/subscriber.ts":[function(require,module,exports) {
"use strict";

var __extends = this && this.__extends || function () {
  var _extendStatics = function extendStatics(d, b) {
    _extendStatics = Object.setPrototypeOf || {
      __proto__: []
    } instanceof Array && function (d, b) {
      d.__proto__ = b;
    } || function (d, b) {
      for (var p in b) {
        if (b.hasOwnProperty(p)) d[p] = b[p];
      }
    };

    return _extendStatics(d, b);
  };

  return function (d, b) {
    _extendStatics(d, b);

    function __() {
      this.constructor = d;
    }

    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();

var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }

    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }

    function step(result) {
      result.done ? resolve(result.value) : new P(function (resolve) {
        resolve(result.value);
      }).then(fulfilled, rejected);
    }

    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};

var __generator = this && this.__generator || function (thisArg, body) {
  var _ = {
    label: 0,
    sent: function sent() {
      if (t[0] & 1) throw t[1];
      return t[1];
    },
    trys: [],
    ops: []
  },
      f,
      y,
      t,
      g;
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;

  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }

  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");

    while (_) {
      try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
        if (y = 0, t) op = [op[0] & 2, t.value];

        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;

          case 4:
            _.label++;
            return {
              value: op[1],
              done: false
            };

          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;

          case 7:
            op = _.ops.pop();

            _.trys.pop();

            continue;

          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }

            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }

            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }

            if (t && _.label < t[2]) {
              _.label = t[2];

              _.ops.push(op);

              break;
            }

            if (t[2]) _.ops.pop();

            _.trys.pop();

            continue;
        }

        op = body.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
    }

    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
};

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

var base_1 = __importDefault(require("./base"));

var ConnectionSubscriber =
/** @class */
function (_super) {
  __extends(ConnectionSubscriber, _super);

  function ConnectionSubscriber() {
    return _super !== null && _super.apply(this, arguments) || this;
  }

  ConnectionSubscriber.prototype.connect = function () {
    this.role = 'downstream';

    if (this.options && this.options.multistream) {
      return this.multiStream();
    } else {
      return this.singleStream();
    }
  };

  ConnectionSubscriber.prototype.singleStream = function () {
    return __awaiter(this, void 0, void 0, function () {
      var offer;

      var _this = this;

      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4
            /*yield*/
            , this.disconnect()];

          case 1:
            _a.sent();

            return [4
            /*yield*/
            , this.createOffer()];

          case 2:
            offer = _a.sent();
            return [4
            /*yield*/
            , this.signaling(offer)];

          case 3:
            _a.sent();

            then(this.connectPeerConnection).then(function (message) {
              if (typeof _this.pc.ontrack === 'undefined') {
                _this.pc.onaddstream = function (event) {
                  this.stream = event.stream;
                  this.remoteClientIds.push(this.stream.id);
                  this.callbacks.addstream(event);
                };
              } else {
                _this.pc.ontrack = function (event) {
                  this.stream = event.streams[0];
                  var streamId = this.stream.id;
                  if (streamId === 'default') return;
                  if (-1 < this.remoteClientIds.indexOf(streamId)) return;
                  event.stream = this.stream;
                  this.remoteClientIds.push(streamId);
                  this.callbacks.addstream(event);
                };
              }

              return _this.setRemoteDescription(message);
            }).then(this.createAnswer).then(this.sendAnswer).then(this.onIceCandidate).then(function () {
              return _this.stream;
            });
            return [2
            /*return*/
            ];
        }
      });
    });
  };

  ConnectionSubscriber.prototype.multiStream = function () {
    var _this = this;

    return this.disconnect().then(this.createOffer).then(this.signaling).then(this.connectPeerConnection).then(function (message) {
      if (typeof _this.pc.ontrack === 'undefined') {
        _this.pc.onaddstream = function (event) {
          _this.remoteClientIds.push(event.id);

          _this.callbacks.addstream(event);
        };
      } else {
        _this.pc.ontrack = function (event) {
          var stream = event.streams[0];
          if (stream.id === 'default') return;
          if (stream.id === _this.clientId) return;
          if (-1 < _this.remoteClientIds.indexOf(stream.id)) return;
          event.stream = stream;

          _this.remoteClientIds.push(stream.id);

          _this.callbacks.addstream(event);
        };
      }

      _this.pc.onremovestream = function (event) {
        var index = _this.remoteClientIds.indexOf(event.stream.id);

        if (-1 < index) {
          delete _this.remoteClientIds[index];
        }

        _this.callbacks.removestream(event);
      };

      return _this.setRemoteDescription(message);
    }).then(this.createAnswer).then(this.sendAnswer).then(this.onIceCandidate);
  };

  return ConnectionSubscriber;
}(base_1.default);

exports.default = ConnectionSubscriber;
},{"./base":"connection/base.ts"}],"../node_modules/parcel/src/builtins/hmr-runtime.js":[function(require,module,exports) {
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
},{}]},{},["../node_modules/parcel/src/builtins/hmr-runtime.js","connection/subscriber.ts"], null)
//# sourceMappingURL=/subscriber.map