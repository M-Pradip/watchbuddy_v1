"use strict";

const users = [];

function userJoin(id, username, room) {
  const user = { id, username, room };
  users.push(user);
  return user;
}

function getUsers(room) {
  return users.filter((user) => user.room === room);
}

function userLeave(id) {
  const userIndex = users.findIndex((user) => user.id === id);
  if (userIndex !== -1) return users.splice(userIndex, 1)[0];
}

function currentUser(id) {
  return users.find((user) => user.id === id);
}

function isHost(id, room) {
  const roomUsers = getUsers(room);
  return roomUsers.length > 0 && roomUsers[0].id === id;
}

function removeAllUsersFromRoom(room) {
  const roomUsers = getUsers(room);
  roomUsers.forEach((user) => {
    const userIndex = users.findIndex((u) => u.id === user.id);
    if (userIndex !== -1) {
      users.splice(userIndex, 1);
    }
  });
  return roomUsers;
}

module.exports = {
  userJoin,
  getUsers,
  userLeave,
  currentUser,
  isHost,
  removeAllUsersFromRoom,
};
