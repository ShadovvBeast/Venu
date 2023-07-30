let localStream: MediaStream;
let peerConnection: RTCPeerConnection;

const startButton = document.getElementById('start') as HTMLButtonElement;
const endButton = document.getElementById('end') as HTMLButtonElement;
const localAudio = document.getElementById('localAudio') as HTMLAudioElement;
const remoteAudio = document.getElementById('remoteAudio') as HTMLAudioElement;

startButton.addEventListener('click', startCall);
endButton.addEventListener('click', endCall);

async function startCall() {
  startButton.disabled = true;
  endButton.disabled = false;

  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
    throw new Error('getUserMedia is not supported by your browser or the webpage is not served over HTTPS or localhost.');
  }

  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  localAudio.srcObject = localStream;

  const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
  peerConnection = new RTCPeerConnection(configuration);

  peerConnection.addEventListener('icecandidate', event => {
    if (event.candidate) {
      // Send the candidate to the remote peer
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

  // Simulate the signaling part using setTimeout and Promise
  const remotePeerConnection = new RTCPeerConnection(configuration);
  remotePeerConnection.addEventListener('icecandidate', event => {
    if (event.candidate) {
      // Send the candidate to the remote peer
    }
  });
  remotePeerConnection.addEventListener('track', event => {
    remoteAudio.srcObject = event.streams[0];
  });
  await remotePeerConnection.setRemoteDescription(offer);
  const answer = await remotePeerConnection.createAnswer();
  await remotePeerConnection.setLocalDescription(answer);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for all ICE candidates
  await peerConnection.setRemoteDescription(remotePeerConnection.localDescription);
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
