import express from "express";
import http from "http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";

const app = express();

const server = http.createServer(app);
const io = new Server(server);

let waitingRoom = [];
const users = [];

let peersCount = 0;

io.on("connection", (socket) => {
  socket.on("signalingMessage", (data) => {
    socket.broadcast.to(data.roomId).emit("signalingMessage", data.message);
  });

  socket.on("user-join", (user) => {
    if (waitingRoom.length > 0) {
      const roomId = uuidv4();
      socket.join(roomId);
      waitingRoom[0].join(roomId);
      users[peersCount - 1].roomId = roomId;
      io.to(roomId).emit("room-name", users[peersCount - 1]);
      waitingRoom = [];
    } else {
      waitingRoom.push(socket);
    }
  });

  socket.on("room-msg", (msg) => {
    try {
      io.to(users[peersCount - 1].roomId).emit("send-msg", {
        msg,
        socketId: socket.id,
        time: socket.handshake.time,
      });
    } catch (error) {
      console.log(error.message);
    }
  });

  socket.on("startVideoCall", ({ roomId }) => {
    console.log("start video call");
    socket.broadcast.to(roomId).emit("incomingCall");
  });

  socket.on("acceptCall", ({ roomId }) => {
    socket.broadcast.to(roomId).emit("callAccepted");
  });
});

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index");
});

let tempUser = "";
let tempCount = 1;
app.post("/chat", (req, res) => {
  if (tempCount === 1) {
    tempUser = req.body.name;
    tempCount++;
  } else if (tempCount === 2) {
    users.push({
      p1: { name: tempUser },
      p2: { name: req.body.name },
    });
    tempUser: "";
    tempCount = 1;
    peersCount++;
  }

  res.render("chat", { username: req.body.name });
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
