const socket = io();

socket.emit("user-join", "in");

socket.on("room-name", (roomName) => {
  console.log(roomName);
});
