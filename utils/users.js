const users = [];

const userJoin = (username, roomId, id) => {
  const user = { id, username, room: roomId };
  users.push(user);
  return user;
};

const userLeave = (id) => {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    users.splice(index, 1);
  }
};

module.exports = {
  users,
  userJoin,
  userLeave,
};
