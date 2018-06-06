/* @flow */
import ConnectionBase from './base';

export default class ConnectionPublisher extends ConnectionBase {
  connect(stream: ?MediaStream.prototype) {
    this.role = 'upstream';
    if (this.options && this.options.multistream) {
      return this._multiStream(stream);
    }
    else {
      return this._singleStream(stream);
    }
  }

  async _singleStream(stream: MediaStream.prototype) {
    await this.disconnect();
    const offer = await this._createOffer();
    const message = await this._signaling(offer);
    const message2 = await this._connectPeerConnection(message);
    if (typeof this._pc.addStream === 'undefined') {
      stream.getTracks().forEach(track => {
        this._pc.addTrack(track, stream);
      });
    }
    else {
      this._pc.addStream(stream);
    }
    this.stream = stream;
    await this._setRemoteDescription(message2);
    await this._createAnswer();
    await this._sendAnswer();
    await this._onIceCandidate();
    return Promise.resolve(stream);
  }

  async _multiStream(stream: MediaStream.prototype) {
    await this.disconnect();
    const offer = await this._createOffer();
    const message = await this._signaling(offer);
    const message2 = await this._connectPeerConnection(message);
    if (typeof this._pc.addStream === 'undefined') {
      stream.getTracks().forEach(track => {
        this._pc.addTrack(track, stream);
      });
    }
    else {
      this._pc.addStream(stream);
    }
    if (typeof this._pc.ontrack === 'undefined') {
      this._pc.onaddstream = event => {
        if (this.clientId !== event.stream.id) {
          this.remoteClientIds.push(stream.id);
          this._callbacks.addstream(event);
        }
      };
    } else {
      this._pc.ontrack = event => {
        const stream = event.streams[0];
        if (!stream) return;
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
    this.stream = stream;
    await this._setRemoteDescription(message2);
    await this._createAnswer();
    await this._sendAnswer();
    await this._onIceCandidate();
    return Promise.resolve(stream);
  }
}
