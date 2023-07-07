console.log("I am working fine ")
let APP_Id = "6680d260aa644362be0e130c8db3e305";

let token = null;

let uid = String ( Math.floor(Math.random()*10000) );

let client ;
let channel;

let localStream;
let remoteStream;
let peerConnection;

const servers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

//  function ask for the video camera connection


let init = async () => {
       client = await AgoraRTM.createInstance(APP_Id);
       await client.login({uid,token});

       channel = client.createChannel('main');
       await channel.join();
 
      //  channel.on("peer-online",handleUserJoined);
      channel.on('MemberJoined',handleUserJoined)
      

  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });

  document.getElementById("user-1").srcObject = localStream;
  createOffer();


};

let handleUserJoined = async (MemberId) => {
  console.log('A new user joined the channel:', MemberId)
}


// now create an offer by setting peer to peer connection

let createOffer = async () => {
  peerConnection = new RTCPeerConnection(servers);

  remoteStream = new MediaStream(); // it create and empty object to bind the audio and video data;
  document.getElementById("user-2").srcObject = remoteStream;

  // add the elments of the track from the local stream
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
    });
  };

  peerConnection.onicecandidate = async (event) => {
    if(event.candidate){
        // console.log(`New Ice candidate`,event.candidate);
    }
  }

  let offer = await peerConnection.createOffer(); 
  await peerConnection.setLocalDescription(offer);
  // console.log("Offer:", offer);
};

init();
