import uuid from 'uuid';
import * as rtc from './rtc-api';
import {peerConnectionsStore, peerChannelsStore} from './store';

const SERVER_PORT = 3000;
const iceServers = {iceServers: [{urls: 'stun:stunserver.org'}]};

const webSockerURI = `ws://localhost:${SERVER_PORT}/`;

const webSocket = new WebSocket(webSockerURI);

const CLIENT_ID = uuid.v4();
document.title = CLIENT_ID;

webSocket.onopen = () => {
  webSocket.send(JSON.stringify({
    type: 'HELLO',
    source: CLIENT_ID
  }));
};

webSocket.onmessage = rawMessage => {
  const message = JSON.parse(rawMessage.data);
  if (message.source !== CLIENT_ID && message.type === 'HELLO') {
    const peerConnection = createPeerConnection(message.source)

    const channel = peerConnection.createDataChannel('communication', {
      reliable: false
    });

    channel.onmessage = ({data}) => {
      console.log('Received data from channel', message.source, data);
    };

    channel.onopen = () => {
      peerChannelsStore.addPeerChannel(message.source, channel);
      console.log(`Created communication channel with ${message.source}`);
    };

    peerConnection.createOffer(offer => {
      peerConnection.setLocalDescription(offer);
      webSocket.send(JSON.stringify({
        type: 'OFFER',
        source: CLIENT_ID,
        destination: message.source,
        payload: offer
      }));
    }, console.error.bind(console));
  }
  if (message.destination === CLIENT_ID) {
    console.log(message);
    switch(message.type) {
      case 'ICE_CANDIDATE': {
        const peerConnection = peerConnectionsStore.peerConnections[message.source];
        peerConnection.addIceCandidate(new rtc.RTCIceCandidate(message.payload));
        break;
      }
      case 'OFFER': {
        const peerConnection = createPeerConnection(message.source);

        peerConnection.ondatachannel = ({channel}) => {
          peerChannelsStore.addPeerChannel(message.source, channel);
          channel.onmessage = ({data}) => {
            console.log('Received data from channel', message.source, data);
          };
          console.log(`Received communication channel from ${message.source}`);
        };

        peerConnection.setRemoteDescription(new rtc.RTCSessionDescription(message.payload));
        peerConnection.createAnswer(answer => {
          peerConnection.setLocalDescription(answer);
          webSocket.send(JSON.stringify({
            type: 'ANSWER',
            source: CLIENT_ID,
            destination: message.source,
            payload: answer
          }));
        }, e => console.log('Answer error', e));
        break;
      }
      case 'ANSWER': {
        const peerConnection = peerConnectionsStore.peerConnections[message.source];
        peerConnection.setRemoteDescription(new rtc.RTCSessionDescription(message.payload));
        break;
      }
    }
  }
}

const createPeerConnection = destination => {
  const peerConnection = new rtc.RTCPeerConnection(iceServers, {
    optional: [{
      DtlsSrtpKeyAgreement: true
    }]
  });

  peerConnectionsStore.addPeerConnection(destination, peerConnection);

  peerConnection.onicecandidate = ({candidate}) => {
    if (candidate) {
      webSocket.send(JSON.stringify({
        type: 'ICE_CANDIDATE',
        source: CLIENT_ID,
        destination,
        payload: candidate
      }));
    }
  };
  return peerConnection;
}
