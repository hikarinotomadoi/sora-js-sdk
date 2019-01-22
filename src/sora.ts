import ConnectionPublisher from './connection/publisher';
import ConnectionSubscriber from './connection/subscriber';
import { ConnectionOptions } from './connection/base';

const Sora = {
  connection: (signalingUrl: string, debug: boolean = false) =>
    new SoraConnection(signalingUrl, debug)
};

class SoraConnection {
  constructor(public signalingUrl: string, public debug: boolean = false) {}

  publisher = (
    channelId: string,
    metadata: string,
    options: ConnectionOptions = { audio: true, video: true }
  ) =>
    new ConnectionPublisher(
      this.signalingUrl,
      channelId,
      metadata,
      options,
      this.debug
    );

  subscriber = (
    channelId: string,
    metadata: string,
    options: ConnectionOptions = { audio: true, video: true }
  ) =>
    new ConnectionSubscriber(
      this.signalingUrl,
      channelId,
      metadata,
      options,
      this.debug
    );
}

export default Sora;
