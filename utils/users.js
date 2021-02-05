const users = [];

const userJoin = (username, roomId, id) => {
  const user = { id, username, room: roomId };
  users.push(user);
  return user;
};

const userLeave = (id, username) => {
  const index = users.find((user) => user.id === id);
  if (index) {
    users.splice(index, 1);
  }
};

module.exports = {
  users,
  userJoin,
  userLeave,
};
