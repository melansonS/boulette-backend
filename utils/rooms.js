const io = require("socket.io");
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
  console.log({ roomId, user });
  const room = rooms.find((room) => room.id === roomId);
  room.users.push(user);
};

const leaveRoom = (roomId, userId) => {
  const room = rooms.find((room) => room.id === roomId);
  if (room) {
    const index = room.users.find((user) => user.id === userId);
    if (index) {
      room.users.splice(index, 1);
    }
    if (room.users.length === 0) {
      rooms.splice(room, 1);
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
  console.log("get all, ", roomId, room);
  if (room) {
    return room.prompts;
  }
};

const getAllUsers = (room) => {
  return room.users;
};

const startRound = (room) => {
  if (!room.roundInProgress) {
    room.roundInProgress = true;
  }
};

const stopRound = (room) => {
  if (room.roundInProgress) {
    room.roundInProgress = false;
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
};
