console.log("I am working fine ")
let APP_Id = "6680d260aa644362be0e130c8db3e305";

let token = null;

let uid = String ( Math.floor(Math.random()*10000) );

let client ;
let channel;


let queryString = window.location.search;
let urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get('room');

if(!roomId) window.location = 'lobby.html'

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

       channel = client.createChannel(roomId);
       await channel.join();
 
      //  channel.on("peer-online",handleUserJoined);
      channel.on('MemberJoined',handleUserJoined);

      channel.on('MemberLeft',handleUserLeft);
      
      client.on("MessageFromPeer",handleMessageFromPeer);
      

  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });

  document.getElementById("user-1").srcObject = localStream;
 
};

let handleUserLeft = (MemberId)=>{
  document.getElementById('user-2').style.display = 'none';
}


let handleMessageFromPeer = async (message,MemberId)=>{
  message = JSON.parse(message.text);
  // console.log('Message:',message);
  if(message.type === 'offer'){
    createAnswer(MemberId, message.offer)
}

if(message.type === 'answer'){
    addAnswer(message.answer)
}

if(message.type === 'candidate'){
    if(peerConnection){
        peerConnection.addIceCandidate(message.candidate)
    }
}

}

let handleUserJoined = async (MemberId) => {
  console.log('A new user joined the channel:', MemberId)
  createOffer(MemberId);
}



// function that create the peer connection ===>
let createPeerConnection = async(MemberId)=>{
  peerConnection = new RTCPeerConnection(servers);

  
  remoteStream = new MediaStream();
  document.getElementById("user-2").srcObject = remoteStream;
  document.getElementById("user-2").style.display = 'block';


  if(!localStream){
      localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });

  document.getElementById("user-1").srcObject = localStream;

  }

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
        client.sendMessageToPeer({text:JSON.stringify({'type':'candidate','candidate':event.candidate})},MemberId);
    }
  }
  // end of function 
}

// now create an offer by setting peer to peer connection
let createOffer = async (MemberId) => {
 

  await createPeerConnection(MemberId); 

  let offer = await peerConnection.createOffer(); 
  await peerConnection.setLocalDescription(offer);
 

  client.sendMessageToPeer({text:JSON.stringify({'type':'offer','offer':offer})},MemberId);
};

let createAnswer = async(MemberId,offer)=>{
  await createPeerConnection(MemberId)

  await peerConnection.setRemoteDescription(offer)

  let answer = await peerConnection.createAnswer()
  await peerConnection.setLocalDescription(answer)

  client.sendMessageToPeer({text:JSON.stringify({'type':'answer', 'answer':answer})}, MemberId)

  
}

let addAnswer = async (answer) => {
  if(!peerConnection.currentRemoteDescription){
      peerConnection.setRemoteDescription(answer)
  }
}

let leaveChannel = async()=>{
  await channel.leave();
  await client.logout();
}


window.addEventListener('beforeunload', leaveChannel)

init();
