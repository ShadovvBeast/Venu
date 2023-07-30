let localStream: MediaStream;
let peerConnection: RTCPeerConnection;
let ws: WebSocket;

const remoteAudio = document.getElementById('remoteAudio') as HTMLAudioElement;

ws = new WebSocket('wss://192.168.1.104:3000');

ws.addEventListener('message', async event => {
  const message = JSON.parse(event.data);
  if (message.offer) {
    if (!peerConnection) {
      startCall();
    }
    await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    ws.send(JSON.stringify({ answer: peerConnection.localDescription }));
  } else if (message.answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
  } else if (message.iceCandidate) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(message.iceCandidate));
  }
});

ws.addEventListener('error', event => {
  console.error('WebSocket error:', event);
  // Handle the error or reconnect the WebSocket
});

ws.addEventListener('close', event => {
  console.log('WebSocket closed:', event);
  // Reconnect the WebSocket
  window.onload();
});

async function startCall() {

  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
    throw new Error('getUserMedia is not supported by your browser or the webpage is not served over HTTPS or localhost.');
  }

  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
  peerConnection = new RTCPeerConnection(configuration);

  peerConnection.addEventListener('icecandidate', event => {
    if (event.candidate) {
      ws.send(JSON.stringify({ iceCandidate: event.candidate }));
    }
  });

  peerConnection.addEventListener('iceconnectionstatechange', () => {
    if (peerConnection.iceConnectionState === 'disconnected') {
      // Handle the disconnection
    }
  });

  peerConnection.addEventListener('track', event => {
    remoteAudio.srcObject = event.streams[0];
  });

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  ws.send(JSON.stringify({ offer: offer }));
}

window.onload = startCall;
