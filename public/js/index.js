const socket = io();
let roomId = null;

function scrollToBottom() {
  const chatContainer = document.querySelector(".chat-container");
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

socket.emit("user-join", "in");

socket.on("room-name", (usernames) => {
  roomId = usernames.roomId;
});

socket.on("send-msg", (data) => {
  document.querySelector(".waiting-msg").style.display = "none";
  const date = new Date(data.time);
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const clockTime = `${hours}:${minutes} ${ampm}`;

  const chatContainer = document.querySelector(".chat-container");
  if (data.socketId !== socket.id) {
    chatContainer.innerHTML += `
        <div class="reciver-container flex items-start justify-start mb-4">
          <div>
            <p
              class="recive-msg text-gray-700 bg-white p-4 rounded-lg shadow-sm"
            >
              ${data.msg}
            </p>
            <span class="text-xs text-gray-500">${clockTime}</span>
            </div> 
             </div>`;
  }
  scrollToBottom();
});

document.querySelector("form").addEventListener("submit", (event) => {
  event.preventDefault();

  let msg = document.querySelector(".msg");
  const chatContainer = document.querySelector(".chat-container");

  chatContainer.innerHTML += `
        <div class="sender-container flex flex-col items-end justify-start mb-4 bg-gray-100">
         <div class="text-right flex">
          <div>
            <p class="send-msg text-white bg-blue-600 p-4 rounded-lg shadow-sm">
              ${msg.value}
            </p>
            <span class="text-xs text-gray-500"></span>
          </div>
          </div>
        </div>`;

  socket.emit("room-msg", msg.value);
  msg.value = "";
});

// WebRTC

const rtcSettings = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

let local = null;
let remote = null;
let peerConnection = null;
let inCall = false;

const initialize = async (flag) => {
  socket.on("signalingMessage", handleSignalingMessage);

  try {
    local = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    document.querySelector(".local-video").srcObject = local;
    document.querySelector(".local-video").style.display = "block";

    initiateOffer(flag);

    inCall = true;
  } catch (error) {
    console.log(error.message);
  }
};

const initiateOffer = async (flag) => {
  await createPeerConnection();

  try {
    if (flag) {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit("signalingMessage", {
        roomId,
        message: JSON.stringify({
          type: "offer",
          offer,
        }),
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const createPeerConnection = async () => {
  peerConnection = new RTCPeerConnection(rtcSettings);

  remote = new MediaStream();

  document.querySelector(".remote-video").srcObject = remote;
  document.querySelector(".remote-video").style.display = "block";
  document.querySelector(".local-video").classList.add("small-frame");

  local.getTracks().forEach((track) => {
    peerConnection.addTrack(track, local);
  });

  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remote.addTrack(track);
    });
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("signalingMessage", {
        roomId,
        message: JSON.stringify({
          type: "candidate",
          candidate: event.candidate,
        }),
      });
    }
  };
};

const handleSignalingMessage = async (message) => {
  const { offer, type, candidate, answer } = JSON.parse(message);

  if (type === "offer") handleOffer(offer);
  if (type === "answer") handleOffer(answer);
  if (type === "candidate" && peerConnection) {
    try {
      await peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.log(error.message);
    }
  }
};

const handleOffer = async (offer) => {
  try {
    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("signalingMessage", {
      roomId,
      message: JSON.stringify({
        type: "answer",
        answer,
      }),
    });
    inCall = true;
  } catch (error) {
    console.log(error.message);
  }
};

const handleAnswer = async (answer) => {
  try {
    await peerConnection.setRemoteDescription(answer);
  } catch (error) {
    console.log(error.message);
  }
};

document.querySelector(".videocall-btn").addEventListener("click", () => {
  socket.emit("startVideoCall", { roomId });
});

socket.on("incomingCall", () => {
  document.querySelector(".incoming-call").classList.remove("hidden");
});

document.querySelector(".accept-call").addEventListener("click", () => {
  document.querySelector(".incoming-call").classList.add("hidden");
  initialize(false);

  document.querySelector(".videoblock").classList.remove("hidden");

  socket.emit("acceptCall", { roomId });
});

socket.on("callAccepted", () => {
  initialize(true);
  document.querySelector(".videoblock").classList.remove("hidden");
});
