const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIo = require("socket.io");
const { users, userJoin, userLeave } = require("./utils/users");
const {
  rooms,
  createRoom,
  joinRoom,
  leaveRoom,
  getAllUsers,
  addPrompt,
  getAllPrompts,
  deletePrompt,
} = require("./utils/rooms");

const app = express();
var corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200, // For legacy browser support
  methods: "GET",
};

app.use(cors(corsOptions));

const port = process.env.PORT || 4001;
const index = require("./routes/index");

app.use(index);

const server = http.createServer(app);

const io = socketIo(server, {
  cors: { origin: "*" },
}); // < Interesting!

let interval;

io.on("connection", (socket) => {
  console.log("New client connected");
  if (interval) {
    clearInterval(interval);
  }
  interval = setInterval(() => getApiAndEmit(socket), 1000);

  socket.on("createRoom", ({ roomId, name }, callback) => {
    let id = roomId;
    if (rooms.find((room) => room.id === roomId)) {
      id += "e";
    }
    // const user = userJoin(name, id, socket.id);
    socket.join(roomId);
    createRoom(id);
    callback({ status: "ok", id });
  });

  socket.on("joinRoom", ({ roomId, name }, callback) => {
    if (!rooms.find((room) => room.id === roomId)) {
      callback({
        status: "room not found",
      });
      return;
    } else {
      socket.join(roomId);
      const user = userJoin(name, roomId, socket.id);
      socket.join(user.room);
      const room = rooms.find((room) => room.id === roomId);
      joinRoom(roomId, user, socket);
      if (room) {
        io.to(roomId).emit("roomUsers", room.users);
        socket.emit("allPrompts", getAllPrompts(roomId));
        console.log("users!? ", room.users);
      }
    }
  });

  socket.on("leaveRoom", ({ roomId }) => {
    leaveRoom(roomId, socket.id, socket);
    const room = rooms.find((room) => room.id === roomId);
    if (room) {
      io.to(roomId).emit("roomUsers", room.users);
      console.log("someone left", room.users);
    }
  });

  socket.on("addPrompt", ({ roomId, prompt }) => {
    addPrompt(roomId, prompt);
    io.to(roomId).emit("allPrompts", getAllPrompts(roomId));
  });
  socket.on("deletePrompt", ({ roomId, promptId }) => {
    deletePrompt(roomId, promptId);
    io.to(roomId).emit("allPrompts", getAllPrompts(roomId));
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    const user = users.find((user) => user.id === socket.id);
    if (user) {
      const room = rooms.find((room) => room.id === user.room);
      if (room) {
        leaveRoom(room.id, socket.id, socket);
        io.to(user.room).emit("roomUsers", room.users);
        console.log("someone left", room.users);
      }
      userLeave(socket.id);
    }
    clearInterval(interval);
  });
});

const getApiAndEmit = (socket) => {
  const response = new Date();
  // Emitting a new message. Will be consumed by the client
  socket.emit("FromAPI", response);
};

server.listen(port, () => {
  console.log(`listening on port ${port}`);
});
