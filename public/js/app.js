"use strict";

const joinRoom = document.querySelector("#joinRoom");
const chatBoard = document.querySelector("#chatBoard");
const chat = document.querySelector("#chat");
const chatForm = document.querySelector("#chatForm");
const video = document.querySelector("#video");
const videoContainer = document.querySelector(".video-container");
const playVideo = document.querySelector(".play-video");
const pauseVideo = document.querySelector(".pause-video");

const firstUser = document.querySelector(".firstUser");

const roomName = document.querySelector(".room");
const usersList = document.querySelector(".users");

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const options = {
  transports: ["websocket"],
};

const socket = io(
  window.location.hostname === "localhost"
    ? "http://localhost:2020"
    : window.location.origin
);

socket.on("connect", () => {
  console.log("connected!");
});

// Store current user info globally
let currentUsername = username;
let isCurrentUserHost = false;

socket.emit("joinRoom", { username, room });

socket.on("roomUsers", ({ room, users }) => {
  if (roomName) roomName.textContent = `Room Number ${room}`;

  if (usersList) {
    usersList.innerHTML = users
      .map((user, index) => {
        const hostIndicator =
          index === 0
            ? ' <span style="color: #ff6b6b; font-weight: bold;">(Host)</span>'
            : "";
        return `<li>${user.username}${hostIndicator}</li>`;
      })
      .join("");

    // Update host status
    isCurrentUserHost = users.length > 0 && users[0].username === username;

    if (isCurrentUserHost) {
      firstUser.classList.remove("hide");
      videoContainer.classList.remove("userAdmin");
      playVideo.classList.remove("hide");
      pauseVideo.classList.remove("hide");
    } else {
      firstUser.classList.add("hide");
      videoContainer.classList.add("userAdmin");
      playVideo.classList.add("hide");
      pauseVideo.classList.add("hide");
    }
  }
});

if (firstUser) {
  firstUser.addEventListener("submit", (e) => {
    e.preventDefault();

    let videoUrl = e.target.videoUrl.value;

    if (videoUrl) {
      let index = videoUrl.indexOf("=");
      let videoId = videoUrl.slice(index + 1, index + 12);
      let link = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&version=3&playerapiid=ytplayer&autoplay=1&controls=0`;
      socket.emit("videoUrl", link);
    }
  });
}

if (chatForm) {
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();

    let msg = e.target.chat.value;

    if (!msg) {
      return false;
    }

    socket.emit("chatMessage", msg);

    e.target.chat.value = "";
    e.target.chat.focus();
  });
}

socket.on("message", (message) => {
  if (chatBoard) {
    chatBoard.innerHTML += `<li> <h3>${message.username} ${message.time}</h3> <p>${message.text}</p></li>`;
    chatBoard.scrollTop = chatBoard.scrollHeight;
  }
});

socket.on("video", (link) => {
  videoContainer.innerHTML = `<iframe id='video' src=${link} allowfullscreen allow="autoplay">
                </iframe>`;

  /* video */

  $("a.play-video").click(function () {
    socket.emit("play");
  });

  socket.on("playVideo", () => {
    $("#video")[0].contentWindow.postMessage(
      '{"event":"command","func":"' + "playVideo" + '","args":""}',
      "*"
    );
  });

  $("a.pause-video").click(function () {
    socket.emit("pause");
  });

  socket.on("pauseVideo", () => {
    $("#video")[0].contentWindow.postMessage(
      '{"event":"command","func":"' + "pauseVideo" + '","args":""}',
      "*"
    );
  });
});

// Handle page refresh vs actual leaving
let isPageRefresh = false;

window.addEventListener("beforeunload", function (e) {
  isPageRefresh = true;
  // If host is refreshing, don't terminate the room
  if (isCurrentUserHost) {
    socket.emit("hostRefresh");
  }
});

// Handle room termination when host leaves
socket.on("roomTerminated", (data) => {
  // Show alert and immediately redirect
  alert(data.message);

  // Disconnect from socket
  socket.disconnect();

  // Redirect to home page immediately
  window.location.href = "/index.html";
});

// Handle socket disconnection (for when server forcefully disconnects)
socket.on("disconnect", (reason) => {
  console.log("Disconnected from server:", reason);

  // If disconnected by server (not by user), redirect to home
  if (reason === "io server disconnect") {
    alert("You have been disconnected from the room.");
    window.location.href = "/index.html";
  }
});

// Handle Leave Room button click
document.addEventListener("DOMContentLoaded", function () {
  const leaveButton = document.getElementById("leave");
  if (leaveButton) {
    leaveButton.addEventListener("click", function (e) {
      e.preventDefault();

      if (isCurrentUserHost) {
        // Host is leaving - confirm termination
        if (
          confirm(
            "You are the host. Leaving will terminate the room for all users. Are you sure?"
          )
        ) {
          socket.emit("hostLeaving");
          window.location.href = "/index.html";
        }
      } else {
        // Regular user leaving
        socket.disconnect();
        window.location.href = "/index.html";
      }
    });
  }
});

/*________________________ Home Page Styling _____________________ */

const wrap = document.querySelector("#wrap");

if (wrap) {
  wrap.addEventListener("click", () => {
    joinRoom.style.display = "flex";
  });
}

const menu = document.querySelector(".menu");
const xMenu = document.querySelector(".Xmenu");

if (menu) {
  menu.addEventListener("click", () => {
    usersList.style.right = "0px";
    usersList.style.top = "0px";
    menu.style.display = "none";
    xMenu.style.display = "block";
  });
  xMenu.addEventListener("click", () => {
    usersList.style.right = "-1000px";
    menu.style.display = "block";
    xMenu.style.display = "none";
  });
}
