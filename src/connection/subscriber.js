/* @flow */
import ConnectionBase from './base';

export default class ConnectionSubscriber extends ConnectionBase {
  connect() {
    this.role = 'downstream';
    if (this.options && this.options.multistream) {
      return this._multiStream();
    }
    else {
      return this._singleStream();
    }
  }
  async _singleStream() {
    let stream = null;
    await this.disconnect();
    const offer = await this._createOffer();
    const message = await this._signaling(offer);
    const message2 = await this._connectPeerConnection(message);
    if (typeof this._pc.ontrack === 'undefined') {
      this._pc.onaddstream = function(event) {
        stream = event.stream;
      };
    }
    else {
      this._pc.ontrack = function(event) {
        stream = event.streams[0];
      };
    }
    await this._setRemoteDescription(message2);
    await this._createAnswer();
    await this._sendAnswer();
    await this._onIceCandidate();
    return Promise.resolve(stream);
  }

  async _multiStream() {
    await this.disconnect();
    const offer = await this._createOffer();
    const message = await this._signaling(offer);
    const message2 = await this._connectPeerConnection(message);
    if (typeof this._pc.ontrack === 'undefined') {
      this._pc.onaddstream = event => {
        this.remoteClientIds.push(event.id);
        this._callbacks.addstream(event);
      };
    } else {
      this._pc.ontrack = event => {
        const stream = event.streams[0];
        if (stream.id === 'default') return;
        if (stream.id === this.clientId) return;
        if (-1 < this.remoteClientIds.indexOf(stream.id)) return;
        event.stream = stream;
        this.remoteClientIds.push(stream.id);
        this._callbacks.addstream(event);
      };
    }
    this._pc.onremovestream = event => {
      const index = this.remoteClientIds.indexOf(event.stream.id);
      if (-1 < index) {
        delete this.remoteClientIds[index];
      }
      this._callbacks.removestream(event);
    };
    await this._setRemoteDescription(message2);
    await this._createAnswer();
    await this._sendAnswer();
    await this._onIceCandidate();
    return Promise.resolve();
  }
}
