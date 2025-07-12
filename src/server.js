"use strict";

require("dotenv").config();
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const socket = require("socket.io");
// const io = socket(server, {
// 	cors: { origin: '*' },
// });
const io = new socket.Server(server);
const {
  userJoin,
  getUsers,
  userLeave,
  currentUser,
  isHost,
  removeAllUsersFromRoom,
} = require("./utilis/user");
const messageTemplate = require("./utilis/messages");

const errorHandler = require("./errors-handlers/500");
const notFound = require("./errors-handlers/404");

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

// Track hosts that are refreshing
const refreshingHosts = new Set();

io.on("connection", (socket) => {
  //join room

  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room, 0);

    socket.join(user.room);

    //welcome for user
    socket.emit(
      "message",
      messageTemplate(user.username, `welcome to room ${user.room}`)
    );

    //broadcast to all member
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        messageTemplate(user.username, `${user.username} has joined`)
      );

    //room info /// users
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getUsers(user.room),
    });
  });

  socket.on("chatMessage", (msg) => {
    const user = currentUser(socket.id);
    io.to(user.room).emit("message", messageTemplate(user.username, msg));
  });

  socket.on("videoUrl", (videoUrl) => {
    const user = currentUser(socket.id);
    io.to(user.room).emit("video", videoUrl);
  });

  socket.on("play", () => {
    const user = currentUser(socket.id);
    io.to(user.room).emit("playVideo");
  });

  socket.on("pause", () => {
    const user = currentUser(socket.id);

    io.to(user.room).emit("pauseVideo");
  });

  socket.on("hostLeaving", () => {
    const user = currentUser(socket.id);

    if (user && isHost(socket.id, user.room)) {
      console.log(
        `Host ${user.username} is leaving room ${user.room}. Terminating room.`
      );

      // Notify all users in the room that the room is being terminated
      io.to(user.room).emit("roomTerminated", {
        message: `Room ${user.room} has been terminated because the host ${user.username} left.`,
      });

      // Small delay to ensure the message is sent before disconnecting
      setTimeout(() => {
        // Remove all users from the room
        removeAllUsersFromRoom(user.room);

        // Force disconnect all sockets in the room
        io.in(user.room).disconnectSockets();
      }, 100);
    }
  });

  socket.on("hostRefresh", () => {
    const user = currentUser(socket.id);
    if (user && isHost(socket.id, user.room)) {
      console.log(`Host ${user.username} is refreshing room ${user.room}`);
      refreshingHosts.add(user.room);

      // Remove from refreshing set after 5 seconds
      setTimeout(() => {
        refreshingHosts.delete(user.room);
      }, 5000);
    }
  });

  socket.on("disconnect", () => {
    const user = currentUser(socket.id);

    if (user) {
      // Check if the disconnecting user is the host BEFORE removing them
      const userIsHost = isHost(socket.id, user.room);

      if (userIsHost) {
        // Check if this host is refreshing the page
        if (refreshingHosts.has(user.room)) {
          console.log(
            `Host ${user.username} is refreshing, not terminating room ${user.room}`
          );
          // Don't terminate room, just remove user temporarily
          userLeave(socket.id);
        } else {
          // Host is actually leaving, terminate the room immediately
          console.log(
            `Host ${user.username} left room ${user.room}. Terminating room.`
          );

          // Notify all users in the room that the room is being terminated
          socket.to(user.room).emit("roomTerminated", {
            message: `Room ${user.room} has been terminated because the host ${user.username} left.`,
          });

          // Immediately remove all users from the room and disconnect sockets
          removeAllUsersFromRoom(user.room);
          io.in(user.room).disconnectSockets();
        }
      } else {
        // Regular user leaving, normal flow
        userLeave(socket.id);

        io.to(user.room).emit(
          "message",
          messageTemplate(user.username, `${user.username} has left`)
        );
        io.to(user.room).emit("roomUsers", {
          room: user.room,
          users: getUsers(user.room),
        });
      }
    }
  });
});

// ----------- //

// Catchalls
app.use(notFound);
app.use(errorHandler);

module.exports = {
  start: (port) => {
    if (!port) {
      throw new Error("Missing Port");
    }
    server.listen(port, () => {
      console.log(`Server Up on ${port}`);
    });
  },
};
