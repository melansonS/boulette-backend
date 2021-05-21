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
  addPrompt,
  getAllPrompts,
  deletePrompt,
  startRound,
  stopRound,
  resetGame,
  startTimer,
  stopTimer,
  changeTeam,
  drawPrompt,
  resetPrompts,
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
  //ROOM
  socket.on("createRoom", ({ roomId }, callback) => {
    let id = roomId;
    if (rooms.find((room) => room.id === roomId)) {
      id += "e";
    }
    socket.join(roomId);
    createRoom(id);
    callback({ status: "ok", id });
  });

  socket.on("joinRoom", ({ roomId, name }) => {
    console.log(" room ", roomId);
    if (!rooms.find((room) => room.id === roomId)) {
      socket.emit("notFound");
      return;
    } else {
      socket.join(roomId);
      const user = userJoin(name, roomId, socket.id);
      socket.join(user.room);
      const room = rooms.find((room) => room.id === roomId);
      joinRoom(roomId, user, socket);
      if (room) {
        io.to(roomId).emit("roomUsers", room.teams);
        socket.emit("allPrompts", getAllPrompts(roomId));
        if (room.roundInProgress) {
          socket.emit("roundStart", room.currentPlayer);
        }
      }
    }
  });

  socket.on("leaveRoom", ({ roomId }) => {
    leaveRoom(roomId, socket.id);
    const room = rooms.find((room) => room.id === roomId);
    const user = users.find((user) => user.id === socket.id);
    if (room) {
      io.to(roomId).emit("roomUsers", room.teams);
      console.log("someone left", room.users);
      if (room.roundInProgress && room.currentPlayer === user.username) {
        stopRound(user.room);
        io.to(user.room).emit("roundStop");
      }
    }
  });

  socket.on("changeTeam", ({ roomId, team }) => {
    const room = rooms.find((room) => room.id === roomId);
    changeTeam(room, socket.id, team);
    io.to(roomId).emit("roomUsers", room.teams);
  });

  //START GAME
  socket.on("startRound", ({ roomId, name, team }) => {
    startRound(roomId, name);
    startTimer(roomId, 120, socket, io);
    io.to(roomId).emit("roundStart", { username: name, team });
    socket.emit("currentlyPlaying");
  });

  socket.on("stopRound", ({ roomId }) => {
    stopRound(roomId);
    stopTimer(roomId, io);
    io.to(roomId).emit("roundStop");
    console.log("Stoping round :D");
  });

  socket.on("resetGame", ({ roomId }) => {
    const results = resetGame(roomId);
    io.to(roomId).emit("gameReset", {
      prompts: results.prompts,
      teams: results.teams,
    });
  });

  //PROMPTS
  socket.on("addPrompt", ({ roomId, prompt }) => {
    addPrompt(roomId, prompt);
    io.to(roomId).emit("allPrompts", getAllPrompts(roomId));
  });

  socket.on("deletePrompt", ({ roomId, promptId }) => {
    deletePrompt(roomId, promptId);
    io.to(roomId).emit("allPrompts", getAllPrompts(roomId));
  });

  socket.on("drawPrompt", ({ roomId, promptId, team }) => {
    const results = drawPrompt(roomId, promptId, team);
    io.to(roomId).emit("promptDrawn", {
      teams: results.teams,
      prompts: results.prompts,
    });
  });

  socket.on("resetPrompts", ({ roomId }) => {
    console.log("reseting Prompts :D", roomId);
    resetPrompts(roomId);
    io.to(roomId).emit("allPrompts", getAllPrompts(roomId));
  });

  //DISCONECT
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    const user = users.find((user) => user.id === socket.id);
    if (user) {
      const room = rooms.find((room) => room.id === user.room);
      if (room) {
        leaveRoom(room.id, socket.id, socket);
        if (room.roundInProgress && room.currentPlayer === user.username) {
          stopRound(user.room);
          io.to(user.room).emit("roundStop");
        }
        io.to(user.room).emit("roomUsers", room.teams);
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
