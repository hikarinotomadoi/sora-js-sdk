import ConnectionBase from './base';

class ConnectionSubscriber extends ConnectionBase {
  connect() {
    this.role = 'downstream';
    if (this.options && this.options.multistream) {
      return this.multiStream();
    } else {
      return this.singleStream();
    }
  }

  private async singleStream() {
    await this.disconnect();
    const offer = await this.createOffer();
    const signalingMessage = await this.signaling(offer as any);
    const message = await this.connectPeerConnection(signalingMessage);
    if (typeof this.pc.ontrack === 'undefined') {
      this.pc.onaddstream = function(event) {
        this.stream = event.stream;
        this.remoteClientIds.push(this.stream.id);
        this.callbacks.addstream(event);
      };
    } else {
      this.pc.ontrack = function(event) {
        this.stream = event.streams[0];
        const streamId = this.stream.id;
        if (streamId === 'default') return;
        if (-1 < this.remoteClientIds.indexOf(streamId)) return;
        event.stream = this.stream;
        this.remoteClientIds.push(streamId);
        this.callbacks.addstream(event);
      };
    }
    await this.setRemoteDescription(message);
    await this.createAnswer();
    this.sendAnswer();
    await this.onIceCandidate();
    return this.stream;
  }

  multiStream = async () => {
    await this.disconnect();
    const offer = await this.createOffer();
    const signalingMessage = await this.signaling(offer as any);
    const message = await this.connectPeerConnection(signalingMessage);
    if (typeof this.pc.ontrack === 'undefined') {
      this.pc.onaddstream = event => {
        this.remoteClientIds.push(event.id);
        this.callbacks.addstream(event);
      };
    } else {
      this.pc.ontrack = event => {
        const stream = event.streams[0];
        if (stream.id === 'default') return;
        if (stream.id === this.clientId) return;
        if (-1 < this.remoteClientIds.indexOf(stream.id)) return;
        event.stream = stream;
        this.remoteClientIds.push(stream.id);
        this.callbacks.addstream(event);
      };
    }
    this.pc.onremovestream = event => {
      const index = this.remoteClientIds.indexOf(event.stream.id);
      if (-1 < index) {
        delete this.remoteClientIds[index];
      }
      this.callbacks.removestream(event);
    };
    await this.setRemoteDescription(message);
    await this.createAnswer();
    this.sendAnswer();
    await this.onIceCandidate();
  };
}

export default ConnectionSubscriber;
