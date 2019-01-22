import ConnectionBase from './base';

class ConnectionPublisher extends ConnectionBase {
  connect(stream: MediaStream | null) {
    this.role = 'upstream';
    if (this.options && this.options.multistream) {
      return this.multiStream(stream);
    } else {
      return this.singleStream(stream);
    }
  }

  private singleStream(stream: MediaStream | null) {
    return this.disconnect()
      .then(this.createOffer)
      .then(this.signaling)
      .then(this.connectPeerConnection)
      .then(message => {
        if (typeof this.pc.addStream === 'undefined') {
          stream.getTracks().forEach(track => {
            this.pc.addTrack(track, stream);
          });
        } else {
          this.pc!.addStream(stream);
        }
        this.stream = stream;
        return this.setRemoteDescription(message);
      })
      .then(this.createAnswer)
      .then(this.sendAnswer)
      .then(this.onIceCandidate)
      .then(() => {
        return this.stream;
      });
  }

  multiStream(stream: MediaStream | null) {
    return this.disconnect()
      .then(this.createOffer)
      .then(this.signaling)
      .then(this.connectPeerConnection)
      .then(message => {
        if (typeof this.pc.addStream === 'undefined') {
          stream.getTracks().forEach(track => {
            this.pc.addTrack(track, stream);
          });
        } else {
          this.pc.addStream(stream);
        }
        if (typeof this.pc.ontrack === 'undefined') {
          this.pc.onaddstream = event => {
            if (this.clientId !== event.stream.id) {
              this.remoteClientIds.push(stream.id);
              this.callbacks.addstream(event);
            }
          };
        } else {
          this.pc.ontrack = event => {
            const stream = event.streams[0];
            if (!stream) return;
            if (stream.id === 'default') return;
            if (stream.id === this.clientId) return;
            if (-1 < this.remoteClientIds.indexOf(stream.id)) return;
            event.stream = stream;
            this.remoteClientIds.push(stream.id);
            this.callbacks.addstream(event);
          };
        }
        this.pc!.onremovestream = event => {
          const index = this.remoteClientIds.indexOf(event.stream.id);
          if (-1 < index) {
            delete this.remoteClientIds[index];
          }
          this.callbacks.removestream(event);
        };
        this.stream = stream;
        return this.setRemoteDescription(message);
      })
      .then(this.createAnswer)
      .then(this.sendAnswer)
      .then(this.onIceCandidate)
      .then(() => {
        return this.stream;
      });
  }
}

export default ConnectionPublisher;
