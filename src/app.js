import uuid from 'uuid';
import * as rtc from './rtc-api';
import {peerConnectionsStore, peerChannelsStore} from './store';

const SERVER_PORT = 3000;
const iceServers = {iceServers: [{urls: 'stun:stunserver.org'}]};

const webSockerURI = `ws://localhost:${SERVER_PORT}/`;

const webSocket = new WebSocket(webSockerURI);

const CLIENT_ID = uuid.v4();

webSocket.onopen = () => {
  webSocket.send(JSON.stringify({
    type: 'HELLO',
    destination: CLIENT_ID 
  }));
};

webSocket.onmessage = rawMessage => {
  const message = JSON.parse(rawMessage.data);
  console.log(message);
  switch(message.type) {
    case 'HELLO': {
      const {destination} = message;
      if (destination !== CLIENT_ID) {
        console.log('Will create a peer connection');
        const peerConnection = new rtc.RTCPeerConnection(iceServers, {
          optional: [{
            DtlsSrtpKeyAgreement: true
          }]
        });

        const channel = peerConnection.createDataChannel('communication', {
          reliable: false
        });

        channel.onmessage = ({data}) => {
          console.log('Received data from channel', destination, data);
        };

        channel.onopen = () => {
          peerChannelsStore.addPeerChannel(destination, channel);
          console.log(`Created communication channel with ${destination}`);
        };

        peerConnection.createOffer(offer => {
          peerConnection.setLocalDescription(offer);
          webSocket.send(JSON.stringify({
            type: 'OFFER',
            source: CLIENT_ID,
            destination,
            payload: offer
          }));
          console.log(`Sent offer to ${destination}`);
        }, console.error.bind(console));

        peerConnection.onicecandidate = ({candidate}) => {
          console.log('Ice candidate !!');
          if (candidate) {
            webSocket.send(JSON.stringify({
              type: 'ICE_CANDIDATE',
              source: CLIENT_ID,
              destination: destination,
              payload: candidate
            }));
          }
        };

        peerConnectionsStore.addPeerConnection(destination, peerConnection);
      }
      break;
    }
    case 'ICE_CANDIDATE': {
      const peerConnection = peerConnectionsStore.peerConnections[message.source];
      peerConnection.addIceCandidate(new rtc.RTCIceCandidate(message.payload));
      break;
    }
    case 'OFFER': {
      const peerConnection = new rtc.RTCPeerConnection(iceServers, {
        optional: [{
          DtlsSrtpKeyAgreement: true
        }]
      });

      peerConnectionsStore.addPeerConnection(message.source, peerConnection);

      peerConnection.onicecandidate = ({candidate}) => {
        if (candidate) {
          webSocket.send(JSON.stringify({
            type: 'ICE_CANDIDATE',
            source: CLIENT_ID,
            destination: destination,
            payload: candidate
          }));
        }
      };

      peerConnection.ondatachannel = ({channel}) => {
        peerChannelsStore.addPeerChannel(source, channel);
        channel.onmessage = ({data}) => {
          console.log('Received data from channel', source, data);
        };
        console.log(`Received communication channel from ${source}`);
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
      });
      break;
    }
    case 'ANSWER': {
      const peerConnection = peerConnectionsStore.peerConnections[message.source];
      peerConnection.setRemoteDescription(new rtc.RTCSessionDescription(message.payload));
      break;
    }
  }
}
