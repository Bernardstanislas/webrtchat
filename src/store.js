import mobx, {observable, computed,} from 'mobx';

class PeerConnectionStore {
  @observable peerConnections = {};

  addPeerConnection(destination, peerConnection) {
    this.peerConnections[destination] = peerConnection;
  }
}

class PeerChannelStore {
  @observable peerChannels = {};

  addPeerChannel(destination, peerChannel) {
    this.peerChannels[destination] = peerChannel;
  }
}

export const peerConnectionsStore = new PeerConnectionStore();
export const peerChannelsStore = new PeerChannelStore();

