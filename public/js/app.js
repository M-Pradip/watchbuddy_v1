"use strict";

const joinRoom = document.querySelector("#joinRoom");
const chatBoard = document.querySelector("#chatBoard");
const chat = document.querySelector("#chat");
const chatForm = document.querySelector("#chatForm");
const videoContainer = document.querySelector(".video-container");
const playVideo = document.querySelector(".play-video");
const pauseVideo = document.querySelector(".pause-video");

const firstUser = document.querySelector(".firstUser");
const roomName = document.querySelector(".room");
const usersList = document.querySelector(".users");
const addVideoBtn = document.getElementById("addVideoBtn");

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

// Improved video handler to support YouTube embeds and direct video files
socket.on("video", (link) => {
  const isYouTube = /youtube\.com|youtu\.be|embed/.test(link);

  if (isYouTube) {
    videoContainer.innerHTML = `<iframe id='video' src="${link}" allowfullscreen allow="autoplay"></iframe>`;

    $("a.play-video")
      .off("click")
      .on("click", function () {
        socket.emit("play");
      });
    socket.off("playVideo").on("playVideo", () => {
      $("#video")[0].contentWindow.postMessage(
        '{"event":"command","func":"playVideo","args":""}',
        "*"
      );
    });

    $("a.pause-video")
      .off("click")
      .on("click", function () {
        socket.emit("pause");
      });
    socket.off("pauseVideo").on("pauseVideo", () => {
      $("#video")[0].contentWindow.postMessage(
        '{"event":"command","func":"pauseVideo","args":""}',
        "*"
      );
    });
  } else {
    videoContainer.innerHTML = `<video id="video" src="${link}" controls autoplay></video>`;

    $("a.play-video")
      .off("click")
      .on("click", function () {
        socket.emit("play");
      });

    socket.off("playVideo").on("playVideo", () => {
      const vid = document.getElementById("video");
      if (vid) vid.play();
    });

    $("a.pause-video")
      .off("click")
      .on("click", function () {
        socket.emit("pause");
      });

    socket.off("pauseVideo").on("pauseVideo", () => {
      const vid = document.getElementById("video");
      if (vid) vid.pause();
    });
  }
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
  alert(data.message);
  socket.disconnect();
  window.location.href = "/index.html";
});

// Handle socket disconnection (for when server forcefully disconnects)
socket.on("disconnect", (reason) => {
  console.log("Disconnected from server:", reason);

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
        if (
          confirm(
            "You are the host. Leaving will terminate the room for all users. Are you sure?"
          )
        ) {
          socket.emit("hostLeaving");
          window.location.href = "/index.html";
        }
      } else {
        socket.disconnect();
        window.location.href = "/index.html";
      }
    });
  }
});

// Home Page Styling (menu toggle, etc.)
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

// Handle Upload Click (Host Only)
if (addVideoBtn) {
  addVideoBtn.addEventListener("click", () => {
    if (!isCurrentUserHost) {
      alert("Only the host can upload videos.");
      return;
    }

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "video/*";
    fileInput.click();

    fileInput.onchange = () => {
      const file = fileInput.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("video", file);

      // Show progress bar elements here (make sure they exist in DOM)
      const progressContainer = document.getElementById("uploadProgress");
      const progressBar = document.getElementById("uploadBar");
      if (progressContainer && progressBar) {
        progressContainer.style.display = "block";
        progressBar.style.width = "0%";
      }

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && progressBar) {
          const percentComplete = (e.loaded / e.total) * 100;
          progressBar.style.width = percentComplete + "%";
        }
      });

      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (progressContainer) progressContainer.style.display = "none";

          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              if (data.url) {
                socket.emit("videoUrl", data.url);
              } else {
                alert("Upload failed.");
              }
            } catch (err) {
              alert("Error parsing server response.");
            }
          } else {
            alert("Upload failed with status " + xhr.status);
          }
        }
      };

      xhr.open("POST", "/upload", true);
      xhr.send(formData);
    };
  });
}
