const { nanoid } = require("nanoid");
const rooms = [
  {
    id: "test",
    users: [{ username: "tom", id: "22", room: "test" }],
    teams: {
      redTeam: {
        points: 0,
        members: [{ username: "tom", id: "22", room: "test" }],
      },
      blueTeam: {
        points: 0,
        members: [],
      },
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
    teams: {
      redTeam: {
        points: 0,
        members: [],
      },
      blueTeam: {
        points: 0,
        members: [],
      },
    },
    prompts: [],
    roundInProgress: false,
  };
  rooms.push(room);
};

const joinRoom = (roomId, user) => {
  const room = rooms.find((room) => room.id === roomId);
  room.users.push(user);
  const team =
    room.teams.redTeam.members.length <= room.teams.blueTeam.members.length
      ? "redTeam"
      : "blueTeam";
  joinTeam(room, user, team);
};

const leaveRoom = (roomId, userId) => {
  const room = rooms.find((room) => room.id === roomId);
  if (room) {
    const uIndex = room.users.findIndex((user) => user.id === userId);
    if (uIndex !== -1) {
      room.users.splice(uIndex, 1);
      const isRed = room.teams.redTeam.members.findIndex(
        (member) => member.id === userId
      );
      const team = isRed !== -1 ? "redTeam" : "blueTeam";
      leaveTeam(room, userId, team);
    }
    if (room.users.length === 0) {
      const rIndex = rooms.findIndex((room) => room.id === roomId);
      rooms.splice(rIndex, 1);
    }
  }
};

const joinTeam = (room, user, team) => {
  room.teams[team].members.push(user);
};

const leaveTeam = (room, userId, team) => {
  const uIndex = room.teams[team].members.findIndex(
    (member) => member.id === userId
  );
  if (uIndex !== -1) {
    room.teams[team].members.splice(uIndex, 1);
  }
};

const changeTeam = (room, user, team) => {};

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
