const { nanoid } = require("nanoid");
const rooms = [
  {
    id: "test",
    users: [{ username: "tom", id: "22", room: "test" }],
    redTeam: {
      points: 0,
      members: [],
    },
    blueTeam: {
      points: 0,
      members: [],
    },
    prompts: [],
    roundInProgress: false,
    currentPlayer: "",
    timer: 60,
    interval: null,
  },
];

const createRoom = (id) => {
  const room = {
    id,
    users: [],
    redTeam: {
      points: 0,
      members: [],
    },
    blueTeam: {
      points: 0,
      members: [],
    },
    prompts: [],
    roundInProgress: false,
  };
  rooms.push(room);
};

const joinRoom = (roomId, user) => {
  const room = rooms.find((room) => room.id === roomId);
  room.users.push(user);
};

const leaveRoom = (roomId, userId) => {
  const room = rooms.find((room) => room.id === roomId);
  if (room) {
    const uIndex = room.users.findIndex((user) => user.id === userId);
    if (uIndex !== -1) {
      room.users.splice(uIndex, 1);
    }
    if (room.users.length === 0) {
      const rIndex = rooms.findIndex((room) => room.id === roomId);
      rooms.splice(rIndex, 1);
    }
  }
};

const addPrompt = (roomId, prompt) => {
  const room = rooms.find((room) => room.id === roomId);
  if (room) {
    const id = nanoid();
    room.prompts.push({ id, text: prompt, drawn: false, skipped: false });
  }
};

const deletePrompt = (roomId, id) => {
  const room = rooms.find((room) => room.id === roomId);
  const index = room.prompts.findIndex((prompt) => prompt.id === id);
  if (index !== -1) {
    room.prompts.splice(index, 1);
  }
};

const getAllPrompts = (roomId) => {
  const room = rooms.find((room) => room.id === roomId);
  if (room) {
    return room.prompts;
  }
};

const getAllUsers = (room) => {
  return room.users;
};

const startRound = (roomId, name) => {
  const room = rooms.find((room) => room.id === roomId);
  if (!room.roundInProgress) {
    room.roundInProgress = true;
    room.currentPlayer = name;
  }
};

const stopRound = (roomId) => {
  const room = rooms.find((room) => room.id === roomId);
  if (room.roundInProgress) {
    room.roundInProgress = false;
    room.currentPlayer = "";
  }
};

const startTimer = (roomId, time = 60, socket, io) => {
  const newTime = new Date().getTime() + time * 1000;
  const room = rooms.find((room) => room.id === roomId);
  if (room.interval) {
    clearInterval(room.interval);
  }
  room.interval = setInterval(
    () => emitRoomTimer(roomId, newTime, socket, io),
    1000
  );
};

const stopTimer = (roomId, io) => {
  const room = rooms.find((room) => room.id === roomId);
  if (room.interval) {
    clearInterval(room.interval);
    stopRound(roomId);
    io.to(roomId).emit("roundStop");
    io.to(roomId).emit("stopTimer");
  }
};

const emitRoomTimer = (roomId, newTime, socket, io) => {
  const current = new Date().getTime();
  const response = newTime - current;
  if (response <= 0) {
    stopTimer(roomId, io);
  } else {
    // Emitting a new message. Will be consumed by the client
    io.to(roomId).emit("roomTimer", response);
  }
};

module.exports = {
  rooms,
  addPrompt,
  createRoom,
  deletePrompt,
  getAllPrompts,
  getAllUsers,
  joinRoom,
  leaveRoom,
  startRound,
  stopRound,
  startTimer,
  stopTimer,
};
