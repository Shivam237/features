const startButton = document.getElementById('startButton');
const localVideo = document.getElementById('localVideo');

let localStream;

startButton.onclick = async () => {

    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        localVideo.srcObject = localStream;
    } catch (e) {
        console.error('Error accessing media devices.', e);
        return;
    }


    const peerConnection = new RTCPeerConnection();


    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });


    const signalingServerUrl = 'wss://your-signaling-server.com';

    const signalingServer = new WebSocket(signalingServerUrl);

    signalingServer.onopen = () => {
        console.log('Connected to the signaling server');

        peerConnection.createOffer()
            .then(offer => peerConnection.setLocalDescription(offer))
            .then(() => {
                signalingServer.send(JSON.stringify({ offer: peerConnection.localDescription }));
            });
    };

    signalingServer.onmessage = message => {
        const data = JSON.parse(message.data);

        if (data.answer) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        }

        if (data.candidate) {
            peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            signalingServer.send(JSON.stringify({ candidate: event.candidate }));
        }
    };

    peerConnection.ontrack = event => {
        const [remoteStream] = event.streams;
    };


    signalingServer.send(JSON.stringify({ type: 'SOS', contacts: ['contact1@example.com', 'contact2@example.com'] }));
};