export type ConnectionOptions = {
  audio?: boolean;
  audioCodecType?: string;
  audioBitRate?: number;
  video?: boolean;
  videoCodecType?: string;
  videoBitRate?: number;
  multistream?: boolean;
  spotlight?: number;
  simulcast?: boolean;
  simulcastQuality?: 'low' | 'middle' | 'high';
};

import {
  createSignalingMessage,
  trace,
  isSafari,
  isUnifiedChrome,
  replaceAnswerSdp
} from '../utils';

export type ConnectionCallbacks = {
  disconnect: (event: CloseEvent) => void;
  push: (data: any) => void;
  addstream: () => void;
  removestream: () => void;
  notify: (data: any) => void;
  log: (title: string, message: Object | string) => void;
};
interface RTCIceCandidateInitMessage extends RTCIceCandidateInit {
  type?: 'candidate';
}

interface Message {}

abstract class ConnectionBase {
  channelId: string;
  metadata: string;
  signalingUrl: string;
  options: ConnectionOptions;
  debug: boolean;
  clientId: string | null;
  remoteClientIds: string[];
  stream: MediaStream | null;
  role: string | null;
  authMetadata: string | null;
  protected ws: WebSocket | null;
  protected pc: RTCPeerConnection | null;
  protected callbacks: ConnectionCallbacks;

  constructor(
    signalingUrl: string,
    channelId: string,
    metadata: string,
    options: ConnectionOptions,
    debug: boolean
  ) {
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
      disconnect: function() {},
      push: function() {},
      addstream: function() {},
      removestream: function() {},
      notify: function() {},
      log: function() {}
    };
    this.authMetadata = null;
  }

  on(kind: keyof ConnectionCallbacks, callback: () => void) {
    if (kind in this.callbacks) {
      this.callbacks[kind] = callback;
    }
  }

  disconnect = () => {
    this.clientId = null;
    this.authMetadata = null;
    this.remoteClientIds = [];
    const closeStream = new Promise<void>((resolve, _) => {
      if (!this.stream) return resolve();
      this.stream.getTracks().forEach(t => {
        t.stop();
      });
      this.stream = null;
      return resolve();
    });
    const closeWebSocket = new Promise<void>((resolve, reject) => {
      if (!this.ws) return resolve();
      this.ws.onclose = () => {};

      let counter = 5;
      const timer_id = setInterval(() => {
        if (!this.ws) {
          clearInterval(timer_id);
          return reject('WebSocket Closing Error');
        }
        if (this.ws.readyState === 3) {
          this.ws = null;
          clearInterval(timer_id);
          return resolve();
        }
        --counter;
        if (counter < 0) {
          clearInterval(timer_id);
          return reject('WebSocket Closing Error');
        }
      }, 1000);
      this.ws.close();
    });
    const closePeerConnection = new Promise<void>((resolve, reject) => {
      // Safari は signalingState が常に stable のため個別に処理する
      if (isSafari() && this.pc) {
        this.pc.oniceconnectionstatechange = null;
        this.pc.close();
        this.pc = null;
        return resolve();
      }
      if (!this.pc || this.pc.signalingState === 'closed') return resolve();

      let counter = 5;
      const timer_id = setInterval(() => {
        if (!this.pc) {
          clearInterval(timer_id);
          return reject('PeerConnection Closing Error');
        }
        if (this.pc.signalingState === 'closed') {
          clearInterval(timer_id);
          this.pc.oniceconnectionstatechange = null;
          this.pc = null;
          return resolve();
        }
        --counter;
        if (counter < 0) {
          clearInterval(timer_id);
          return reject('PeerConnection Closing Error');
        }
      }, 1000);
      this.pc.close();
    });
    return Promise.all([closeStream, closeWebSocket, closePeerConnection]);
  };

  protected signaling(offer: { type: 'offer'; sdp: string }) {
    this.trace('CREATE OFFER SDP', offer);
    return new Promise<Message>((resolve, reject) => {
      const signalingMessage = createSignalingMessage(
        offer.sdp,
        this.role,
        this.channelId,
        this.metadata,
        this.options
      );
      if (this.ws === null) {
        this.ws = new WebSocket(this.signalingUrl);
      }
      this.ws.onclose = e => {
        reject(e);
      };
      this.ws.onopen = () => {
        this.trace('SIGNALING CONNECT MESSAGE', signalingMessage);
        this.ws!.send(JSON.stringify(signalingMessage));
      };
      this.ws.onmessage = event => {
        const data: Message = JSON.parse(event.data);
        if (data.type == 'offer') {
          this.clientId = data.client_id;
          this.ws!.onclose = e => {
            this.disconnect().then(() => {
              this.callbacks.disconnect(e);
            });
          };
          this.ws!.onerror = null;
          if ('metadata' in data) {
            this.authMetadata = data.metadata;
          }
          this.trace('SIGNALING OFFER MESSAGE', data);
          this.trace('OFFER SDP', data.sdp);
          resolve(data);
        } else if (data.type == 'update') {
          this.trace('UPDATE SDP', data.sdp);
          this.update(data);
        } else if (data.type == 'ping') {
          this.ws!.send(JSON.stringify({ type: 'pong' }));
        } else if (data.type == 'push') {
          this.callbacks.push(data);
        } else if (data.type == 'notify') {
          this.callbacks.notify(data);
        }
      };
    });
  }

  protected async createOffer() {
    interface Config {
      iceServers: never[];
      sdpSemantics?: 'unified-plan';
    }
    let config: Config = { iceServers: [] };
    if (isUnifiedChrome()) {
      config = { ...config, sdpSemantics: 'unified-plan' };
    }
    const pc = new RTCPeerConnection(config);
    if (isSafari()) {
      pc.addTransceiver('video').direction = 'recvonly';
      pc.addTransceiver('audio').direction = 'recvonly';
      const offer = await pc.createOffer();
      pc.close();
      return Promise.resolve(offer);
    }
    const offer_1 = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    pc.close();
    return Promise.resolve(offer_1);
  }

  protected async connectPeerConnection(_message: {
    config?: RTCConfiguration;
  }) {
    interface Config extends RTCConfiguration {
      sdpSemantics?: 'unified-plan';
    }
    interface Message {
      config?: Config;
    }
    const message: Message = { ..._message };
    if (!message.config) {
      message.config = {};
    }
    if (RTCPeerConnection.generateCertificate === undefined) {
      if (isUnifiedChrome()) {
        message.config = { ...message.config, sdpSemantics: 'unified-plan' };
      }
      this.trace('PEER CONNECTION CONFIG', message.config);
      this.pc = new RTCPeerConnection(message.config);
      this.pc.oniceconnectionstatechange = _ => {
        this.trace(
          'ONICECONNECTIONSTATECHANGE ICECONNECTIONSTATE',
          this.pc!.iceConnectionState
        );
      };
      return Promise.resolve(message);
    } else {
      const certificate = await RTCPeerConnection.generateCertificate({
        name: 'ECDSA',
        namedCurve: 'P-256'
      });
      message.config.certificates = [certificate];
      if (isUnifiedChrome()) {
        message.config = { ...message.config, sdpSemantics: 'unified-plan' };
      }
      this.trace('PEER CONNECTION CONFIG', message.config);
      this.pc = new RTCPeerConnection(message.config);
      this.pc.oniceconnectionstatechange = _ => {
        this.trace(
          'ONICECONNECTIONSTATECHANGE ICECONNECTIONSTATE',
          this.pc!.iceConnectionState
        );
      };
      return message;
    }
  }

  protected setRemoteDescription(message: never) {
    return this.pc!.setRemoteDescription(
      new RTCSessionDescription({ type: 'offer', sdp: message.sdp })
    );
  }

  protected createAnswer = async () => {
    const sessionDescription = await this.pc!.createAnswer();
    if (this.options.simulcast) {
      sessionDescription.sdp = replaceAnswerSdp(sessionDescription.sdp!);
    }
    return this.pc!.setLocalDescription(sessionDescription);
  };

  protected sendAnswer() {
    this.trace('ANSWER SDP', this.pc!.localDescription!.sdp);
    this.ws!.send(
      JSON.stringify({ type: 'answer', sdp: this.pc!.localDescription!.sdp })
    );
    return;
  }

  protected sendUpdateAnswer = () => {
    this.trace('ANSWER SDP', this.pc!.localDescription!.sdp);
    this.ws!.send(
      JSON.stringify({ type: 'update', sdp: this.pc!.localDescription!.sdp })
    );
    return;
  };

  protected onIceCandidate() {
    return new Promise<void>((resolve, reject) => {
      const timerId = setInterval(() => {
        if (this.pc === null) {
          clearInterval(timerId);
          const error = new Error();
          error.message = 'ICECANDIDATE TIMEOUT';
          reject(error);
        } else if (this.pc && this.pc.iceConnectionState === 'connected') {
          clearInterval(timerId);
          resolve();
        }
      }, 100);
      this.pc!.onicecandidate = event => {
        this.trace(
          'ONICECANDIDATE ICEGATHERINGSTATE',
          this.pc!.iceGatheringState
        );
        if (event.candidate === null) {
          clearInterval(timerId);
          resolve();
        } else {
          const message: RTCIceCandidateInitMessage = event.candidate.toJSON();
          message.type = 'candidate';
          this.trace('ONICECANDIDATE CANDIDATE MESSAGE', message);
          this.ws!.send(JSON.stringify(message));
        }
      };
    });
  }

  protected update = (message: never) => this.setRemoteDescription(message);

  protected trace(title: string, message: Object | string) {
    this.callbacks.log(title, message);
    if (!this.debug) {
      return;
    }
    trace(this.clientId, title, message);
  }
}

export default ConnectionBase;
