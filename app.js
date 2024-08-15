import express from "express";
import http from "http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";

const app = express();

const server = http.createServer(app);
const io = new Server(server);

let waitingRoom = [];
const users = {};

let peersCount = 1;

io.on("connection", (socket) => {
  socket.on("user-join", (user) => {
    if (waitingRoom.length > 0) {
      const roomId = uuidv4();
      socket.join(roomId);
      waitingRoom[0].join(roomId);

      io.to(roomId).emit("room-name", roomId);
      waitingRoom = [];
    } else {
      waitingRoom.push(socket);
    }
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
    users[`peers${peersCount}`] = {
      p1: tempUser,
      p2: req.body.name,
    };
    tempUser: "";
    tempCount = 1;
    peersCount++;
  }

  console.log(users);
  

  res.render("chat");
});

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});
