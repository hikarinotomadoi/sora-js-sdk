/*!
 * sora-js-sdk
 * WebRTC SFU Sora Signaling Library
 * @version: 1.9.0
 * @author: Shiguredo Inc.
 * @license: Apache-2.0
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("Sora", [], factory);
	else if(typeof exports === 'object')
		exports["Sora"] = factory();
	else
		root["Sora"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__utils__ = __webpack_require__(3);
function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }




const RTCPeerConnection = window.RTCPeerConnection;
const RTCSessionDescription = window.RTCSessionDescription;

class ConnectionBase {

  constructor(signalingUrl, channelId, metadata, options, debug) {
    this.channelId = channelId;
    this.metadata = metadata;
    this.signalingUrl = signalingUrl;
    this.options = options;
    this.constraints = null;
    this.debug = debug;
    this.clientId = null;
    this.remoteClientIds = [];
    this.stream = null;
    this.role = null;
    this._ws = null;
    this._pc = null;
    this._callbacks = {
      disconnect: function () {},
      push: function () {},
      addstream: function () {},
      removestream: function () {},
      notify: function () {},
      log: function () {}
    };
    this.authMetadata = null;
  }

  on(kind, callback) {
    if (kind in this._callbacks) {
      this._callbacks[kind] = callback;
    }
  }

  disconnect() {
    var _this = this;

    return _asyncToGenerator(function* () {
      _this.clientId = null;
      _this.authMetadata = null;
      _this.remoteClientIds = [];
      const closeStream = new Promise(function (resolve, _) {
        if (!_this.stream) return resolve();
        _this.stream.getTracks().forEach(function (t) {
          t.stop();
        });
        _this.stream = null;
        return resolve();
      });
      const closeWebSocket = new Promise(function (resolve, reject) {
        if (!_this._ws) return resolve();
        _this._ws.onclose = function () {};

        let counter = 5;
        const timer_id = setInterval(function () {
          if (!_this._ws) {
            clearInterval(timer_id);
            return reject('WebSocket Closing Error');
          }
          if (_this._ws.readyState === 3) {
            _this._ws = null;
            clearInterval(timer_id);
            return resolve();
          }
          --counter;
          if (counter < 0) {
            clearInterval(timer_id);
            return reject('WebSocket Closing Error');
          }
        }, 1000);
        _this._ws.close();
      });
      const closePeerConnection = new Promise(function (resolve, reject) {
        // Safari は signalingState が常に stable のため個別に処理する
        if (Object(__WEBPACK_IMPORTED_MODULE_0__utils__["b" /* isSafari */])() && _this._pc) {
          _this._pc.oniceconnectionstatechange = null;
          _this._pc.close();
          _this._pc = null;
          return resolve();
        }
        if (!_this._pc || _this._pc.signalingState === 'closed') return resolve();

        let counter = 5;
        const timer_id = setInterval(function () {
          if (!_this._pc) {
            clearInterval(timer_id);
            return reject('PeerConnection Closing Error');
          }
          if (_this._pc.signalingState === 'closed') {
            clearInterval(timer_id);
            _this._pc.oniceconnectionstatechange = null;
            _this._pc = null;
            return resolve();
          }
          --counter;
          if (counter < 0) {
            clearInterval(timer_id);
            return reject('PeerConnection Closing Error');
          }
        }, 1000);
        _this._pc.close();
      });
      return Promise.all([closeStream, closeWebSocket, closePeerConnection]);
    })();
  }

  _signaling(offer) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      _this2._trace('CREATE OFFER SDP', offer);
      return new Promise(function (resolve, reject) {
        if (_this2._ws === null) {
          _this2._ws = new WebSocket(_this2.signalingUrl);
        }
        _this2._ws.onclose = function (e) {
          reject(e);
        };
        _this2._ws.onopen = function () {
          const signalingMessage = Object(__WEBPACK_IMPORTED_MODULE_0__utils__["a" /* createSignalingMessage */])(offer.sdp, _this2.role, _this2.channelId, _this2.metadata, _this2.options);
          _this2._trace('SIGNALING CONNECT MESSAGE', signalingMessage);
          _this2._ws.send(JSON.stringify(signalingMessage));
        };
        _this2._ws.onmessage = function (event) {
          const data = JSON.parse(event.data);
          if (data.type == 'offer') {
            _this2.clientId = data.client_id;
            _this2._ws.onclose = function (e) {
              _this2.disconnect().then(function () {
                _this2._callbacks.disconnect(e);
              });
            };
            _this2._ws.onerror = null;
            if ('metadata' in data) {
              _this2.authMetadata = data.metadata;
            }
            _this2._trace('SIGNALING OFFER MESSAGE', data);
            _this2._trace('OFFER SDP', data.sdp);
            resolve(data);
          } else if (data.type == 're-offer') {
            _this2._trace('RE-OFFER SDP', data.sdp);
            _this2._reOffer(data);
          } else if (data.type == 'ping') {
            _this2._ws.send(JSON.stringify({ type: 'pong' }));
          } else if (data.type == 'push') {
            _this2._callbacks.push(data);
          } else if (data.type == 'notify') {
            _this2._callbacks.notify(data);
          }
        };
      });
    })();
  }

  _createOffer() {
    return _asyncToGenerator(function* () {
      let config = { iceServers: [] };
      if (Object(__WEBPACK_IMPORTED_MODULE_0__utils__["c" /* isUnifiedChrome */])()) {
        config = Object.assign({}, config, { sdpSemantics: 'unified-plan' });
      }
      const pc = new RTCPeerConnection(config);
      let offer;
      if (Object(__WEBPACK_IMPORTED_MODULE_0__utils__["b" /* isSafari */])()) {
        pc.addTransceiver('video').setDirection('recvonly');
        pc.addTransceiver('audio').setDirection('recvonly');
        offer = yield pc.createOffer();
      } else {
        offer = yield pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      }
      pc.close();
      return Promise.resolve(offer);
    })();
  }

  _connectPeerConnection(message) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      if (!message.config) {
        message.config = {};
      }
      if (RTCPeerConnection.generateCertificate === undefined) {
        if (Object(__WEBPACK_IMPORTED_MODULE_0__utils__["c" /* isUnifiedChrome */])()) {
          message.config = Object.assign(message.config, { sdpSemantics: 'unified-plan' });
        }
        _this3._trace('PEER CONNECTION CONFIG', message.config);
        _this3._pc = new RTCPeerConnection(message.config, _this3.constraints);
        _this3._pc.oniceconnectionstatechange = function (_) {
          _this3._trace('ONICECONNECTIONSTATECHANGE ICECONNECTIONSTATE', _this3._pc.iceConnectionState);
        };
      } else {
        const certificate = yield RTCPeerConnection.generateCertificate({ name: 'ECDSA', namedCurve: 'P-256' });
        message.config.certificates = [certificate];
        if (Object(__WEBPACK_IMPORTED_MODULE_0__utils__["c" /* isUnifiedChrome */])()) {
          message.config = Object.assign(message.config, { sdpSemantics: 'unified-plan' });
        }
        _this3._trace('PEER CONNECTION CONFIG', message.config);
        _this3._pc = new RTCPeerConnection(message.config, _this3.constraints);
        _this3._pc.oniceconnectionstatechange = function (_) {
          _this3._trace('ONICECONNECTIONSTATECHANGE ICECONNECTIONSTATE', _this3._pc.iceConnectionState);
        };
      }
      return Promise.resolve(message);
    })();
  }

  _setRemoteDescription(message) {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      return _this4._pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: message.sdp }));
    })();
  }

  _createAnswer() {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      const sessionDescription = yield _this5._pc.createAnswer();
      return _this5._pc.setLocalDescription(sessionDescription);
    })();
  }

  _sendAnswer() {
    var _this6 = this;

    return _asyncToGenerator(function* () {
      _this6._trace('ANSWER SDP', _this6._pc.localDescription.sdp);
      _this6._ws.send(JSON.stringify({ type: 'answer', sdp: _this6._pc.localDescription.sdp }));
      return Promise.resolve();
    })();
  }

  _sendReAnswer() {
    var _this7 = this;

    return _asyncToGenerator(function* () {
      _this7._trace('ANSWER SDP', _this7._pc.localDescription.sdp);
      _this7._ws.send(JSON.stringify({ type: 're-answer', sdp: _this7._pc.localDescription.sdp }));
      return Promise.resolve();
    })();
  }

  _onIceCandidate() {
    var _this8 = this;

    return _asyncToGenerator(function* () {
      return new Promise(function (resolve, reject) {
        const timerId = setInterval(function () {
          if (_this8._pc === null) {
            clearInterval(timerId);
            const error = new Error();
            error.message = 'ICECANDIDATE TIMEOUT';
            reject(error);
          } else if (_this8._pc && _this8._pc.iceConnectionState === 'connected') {
            clearInterval(timerId);
            resolve();
          }
        }, 100);
        _this8._pc.onicecandidate = function (event) {
          _this8._trace('ONICECANDIDATE ICEGATHERINGSTATE', _this8._pc.iceGatheringState);
          if (event.candidate === null) {
            clearInterval(timerId);
            resolve();
          } else {
            const message = event.candidate.toJSON();
            message.type = 'candidate';
            _this8._trace('ONICECANDIDATE CANDIDATE MESSAGE', message);
            _this8._ws.send(JSON.stringify(message));
          }
        };
      });
    })();
  }

  _reOffer(message) {
    var _this9 = this;

    return _asyncToGenerator(function* () {
      yield _this9._setRemoteDescription(message);
      yield _this9._createAnswer.bind(_this9);
      yield _this9._sendReAnswer.bind(_this9);
      return Promise.resolve();
    })();
  }

  _trace(title, message) {
    this._callbacks.log(title, message);
    if (!this.debug) {
      return;
    }
    Object(__WEBPACK_IMPORTED_MODULE_0__utils__["d" /* trace */])(this.clientId, title, message);
  }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = ConnectionBase;


/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "connection", function() { return connection; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__connection_publisher__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__connection_subscriber__ = __webpack_require__(4);





class SoraConnection {

  constructor(signalingUrl, debug = false) {
    this.signalingUrl = signalingUrl;
    this.debug = debug;
  }

  publisher(channelId, metadata, options = { audio: true, video: true }) {
    return new __WEBPACK_IMPORTED_MODULE_0__connection_publisher__["a" /* default */](this.signalingUrl, channelId, metadata, options, this.debug);
  }

  subscriber(channelId, metadata, options = { audio: true, video: true }) {
    return new __WEBPACK_IMPORTED_MODULE_1__connection_subscriber__["a" /* default */](this.signalingUrl, channelId, metadata, options, this.debug);
  }
}

const connection = function (signalingUrl, debug = false) {
  return new SoraConnection(signalingUrl, debug);
};



/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__base__ = __webpack_require__(0);
function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }



class ConnectionPublisher extends __WEBPACK_IMPORTED_MODULE_0__base__["a" /* default */] {
  connect(stream) {
    this.role = 'upstream';
    if (this.options && this.options.multistream) {
      return this._multiStream(stream);
    } else {
      return this._singleStream(stream);
    }
  }

  _singleStream(stream) {
    var _this = this;

    return _asyncToGenerator(function* () {
      yield _this.disconnect();
      const offer = yield _this._createOffer();
      const message = yield _this._signaling(offer);
      const message2 = yield _this._connectPeerConnection(message);
      if (typeof _this._pc.addStream === 'undefined') {
        stream.getTracks().forEach(function (track) {
          _this._pc.addTrack(track, stream);
        });
      } else {
        _this._pc.addStream(stream);
      }
      _this.stream = stream;
      yield _this._setRemoteDescription(message2);
      yield _this._createAnswer();
      yield _this._sendAnswer();
      yield _this._onIceCandidate();
      return Promise.resolve(stream);
    })();
  }

  _multiStream(stream) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      yield _this2.disconnect();
      const offer = yield _this2._createOffer();
      const message = yield _this2._signaling(offer);
      const message2 = yield _this2._connectPeerConnection(message);
      if (typeof _this2._pc.addStream === 'undefined') {
        stream.getTracks().forEach(function (track) {
          _this2._pc.addTrack(track, stream);
        });
      } else {
        _this2._pc.addStream(stream);
      }
      if (typeof _this2._pc.ontrack === 'undefined') {
        _this2._pc.onaddstream = function (event) {
          if (_this2.clientId !== event.stream.id) {
            _this2.remoteClientIds.push(stream.id);
            _this2._callbacks.addstream(event);
          }
        };
      } else {
        _this2._pc.ontrack = function (event) {
          const stream = event.streams[0];
          if (!stream) return;
          if (stream.id === 'default') return;
          if (stream.id === _this2.clientId) return;
          if (-1 < _this2.remoteClientIds.indexOf(stream.id)) return;
          event.stream = stream;
          _this2.remoteClientIds.push(stream.id);
          _this2._callbacks.addstream(event);
        };
      }
      _this2._pc.onremovestream = function (event) {
        const index = _this2.remoteClientIds.indexOf(event.stream.id);
        if (-1 < index) {
          delete _this2.remoteClientIds[index];
        }
        _this2._callbacks.removestream(event);
      };
      _this2.stream = stream;
      yield _this2._setRemoteDescription(message2);
      yield _this2._createAnswer();
      yield _this2._sendAnswer();
      yield _this2._onIceCandidate();
      return Promise.resolve(stream);
    })();
  }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = ConnectionPublisher;


/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["d"] = trace;
/* harmony export (immutable) */ __webpack_exports__["c"] = isUnifiedChrome;
/* unused harmony export isEdge */
/* harmony export (immutable) */ __webpack_exports__["b"] = isSafari;
/* harmony export (immutable) */ __webpack_exports__["a"] = createSignalingMessage;
function trace(clientId, title, value) {
  let prefix = '';
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

function browser() {
  const ua = window.navigator.userAgent.toLocaleLowerCase();
  if (ua.indexOf('chrome') !== -1) {
    return 'chrome';
  } else if (ua.indexOf('edge') !== -1) {
    return 'edge';
  } else if (ua.indexOf('firefox') !== -1) {
    return 'firefox';
  } else if (ua.indexOf('safari') !== -1) {
    return 'safari';
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
  const ua = window.navigator.userAgent.toLocaleLowerCase();
  const splitedUserAgent = /chrome\/([\d.]+)/.exec(ua);
  if (!splitedUserAgent || splitedUserAgent.length < 2) {
    return false;
  }
  return 70 <= parseInt(splitedUserAgent[1]);
}

function isEdge() {
  return browser() === 'edge';
}

function isSafari() {
  return browser() === 'safari';
}

function createSignalingMessage(offerSDP, role, channelId, metadata, options) {
  const message = {
    type: 'connect',
    role: role,
    channel_id: channelId,
    metadata: metadata,
    sdp: offerSDP,
    userAgent: window.navigator.userAgent,
    audio: true,
    video: true
  };
  Object.keys(message).forEach(key => {
    if (message[key] === undefined) {
      message[key] = null;
    }
  });
  // multistream
  if ('multistream' in options && options.multistream === true) {
    message.multistream = true;
    if (!isUnifiedChrome() && isPlanB()) {
      message.plan_b = true;
    }
  }
  // spotlight
  if ('spotlight' in options) {
    message.spotlight = options.spotlight;
  }
  // parse options
  const audioPropertyKeys = ['audioCodecType', 'audioBitRate'];
  const videoPropertyKeys = ['videoCodecType', 'videoBitRate'];
  const copyOptions = Object.assign({}, options);
  Object.keys(copyOptions).forEach(key => {
    if (key === 'audio' && typeof copyOptions[key] === 'boolean') return;
    if (key === 'video' && typeof copyOptions[key] === 'boolean') return;
    if (0 <= audioPropertyKeys.indexOf(key) && copyOptions[key] !== null) return;
    if (0 <= videoPropertyKeys.indexOf(key) && copyOptions[key] !== null) return;
    delete copyOptions[key];
  });

  if ('audio' in copyOptions) {
    message.audio = copyOptions.audio;
  }
  const hasAudioProperty = Object.keys(copyOptions).some(key => {
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
  const hasVideoProperty = Object.keys(copyOptions).some(key => {
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

/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__base__ = __webpack_require__(0);
function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }



class ConnectionSubscriber extends __WEBPACK_IMPORTED_MODULE_0__base__["a" /* default */] {
  connect() {
    this.role = 'downstream';
    if (this.options && this.options.multistream) {
      return this._multiStream();
    } else {
      return this._singleStream();
    }
  }
  _singleStream() {
    var _this = this;

    return _asyncToGenerator(function* () {
      yield _this.disconnect();
      const offer = yield _this._createOffer();
      const message = yield _this._signaling(offer);
      const message2 = yield _this._connectPeerConnection(message);
      if (typeof _this._pc.ontrack === 'undefined') {
        _this._pc.onaddstream = function (event) {
          this.stream = event.stream;
        }.bind(_this);
      } else {
        _this._pc.ontrack = function (event) {
          this.stream = event.streams[0];
        }.bind(_this);
      }
      yield _this._setRemoteDescription(message2);
      yield _this._createAnswer();
      yield _this._sendAnswer();
      yield _this._onIceCandidate();
      return Promise.resolve(_this.stream);
    })();
  }

  _multiStream() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      yield _this2.disconnect();
      const offer = yield _this2._createOffer();
      const message = yield _this2._signaling(offer);
      const message2 = yield _this2._connectPeerConnection(message);
      if (typeof _this2._pc.ontrack === 'undefined') {
        _this2._pc.onaddstream = function (event) {
          _this2.remoteClientIds.push(event.id);
          _this2._callbacks.addstream(event);
        };
      } else {
        _this2._pc.ontrack = function (event) {
          const stream = event.streams[0];
          if (stream.id === 'default') return;
          if (stream.id === _this2.clientId) return;
          if (-1 < _this2.remoteClientIds.indexOf(stream.id)) return;
          event.stream = stream;
          _this2.remoteClientIds.push(stream.id);
          _this2._callbacks.addstream(event);
        };
      }
      _this2._pc.onremovestream = function (event) {
        const index = _this2.remoteClientIds.indexOf(event.stream.id);
        if (-1 < index) {
          delete _this2.remoteClientIds[index];
        }
        _this2._callbacks.removestream(event);
      };
      yield _this2._setRemoteDescription(message2);
      yield _this2._createAnswer();
      yield _this2._sendAnswer();
      yield _this2._onIceCandidate();
      return Promise.resolve();
    })();
  }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = ConnectionSubscriber;


/***/ })
/******/ ]);
});