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
     <img
            src="/images/default.jpg"
            alt="User Avatar"
            class="mr-3 h-10 w-10 rounded-full object-cover"
          />
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
          <img
            src="/images/default.jpg"
            alt="User Avatar"
            class="ml-3 h-10 w-10 rounded-full object-cover"
          />
          </div>
        </div>`;

  socket.emit("room-msg", msg.value);
  msg.value = "";
});
