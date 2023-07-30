let localStream: MediaStream;
let peerConnection: RTCPeerConnection;
let ws: WebSocket;

const startButton = document.getElementById('start') as HTMLButtonElement;
const endButton = document.getElementById('end') as HTMLButtonElement;
const localAudio = document.getElementById('localAudio') as HTMLAudioElement;
const remoteAudio = document.getElementById('remoteAudio') as HTMLAudioElement;

startButton.addEventListener('click', startCall);
endButton.addEventListener('click', endCall);

ws = new WebSocket('wss://localhost:3000');

ws.addEventListener('message', async event => {
  const message = JSON.parse(event.data);
  if (message.offer) {
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

async function startCall() {
  startButton.disabled = true;
  endButton.disabled = false;

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
      endCall();
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

function endCall() {
  startButton.disabled = false;
  endButton.disabled = true;

  localStream.getTracks().forEach(track => track.stop());
  if (remoteAudio.srcObject) {
    (remoteAudio.srcObject as MediaStream).getTracks().forEach(track => track.stop());
  }

  peerConnection.close();
  peerConnection = null;
  remoteAudio.srcObject = null;
}
