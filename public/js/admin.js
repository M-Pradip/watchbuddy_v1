// Admin.js - Chat Sidebar Toggle Functionality for Watch Party

document.addEventListener("DOMContentLoaded", function () {
  // Get DOM elements
  const chatToggleBtn = document.getElementById("chatToggleBtn");
  const chatCloseBtn = document.getElementById("chatCloseBtn");
  const chatSection = document.getElementById("chatSection");
  const videoSection = document.querySelector(".video-section");
  const urlInputSection = document.querySelector(".url-input-section");

  // State management
  let isChatOpen = false;

  // Initialize chat state
  function initializeChatState() {
    // Chat starts closed by default
    chatSection.classList.remove("open");
    chatToggleBtn.classList.remove("hidden");
    videoSection.classList.remove("chat-open");
    if (urlInputSection) {
      urlInputSection.classList.remove("chat-open");
    }
    isChatOpen = false;
  }

  // Open chat sidebar
  function openChat() {
    chatSection.classList.add("open");
    chatToggleBtn.classList.add("hidden");
    videoSection.classList.add("chat-open");
    if (urlInputSection) {
      urlInputSection.classList.add("chat-open");
    }
    isChatOpen = true;

    // Focus on chat input when opened
    setTimeout(() => {
      const chatInput = document.getElementById("chat");
      if (chatInput) {
        chatInput.focus();
      }
    }, 300);
  }

  // Close chat sidebar
  function closeChat() {
    chatSection.classList.remove("open");
    chatToggleBtn.classList.remove("hidden");
    videoSection.classList.remove("chat-open");
    if (urlInputSection) {
      urlInputSection.classList.remove("chat-open");
    }
    isChatOpen = false;
  }
  function toggleChat() {
    if (isChatOpen) {
      closeChat();
    } else {
      openChat();
    }
  }

  // Event listeners
  if (chatToggleBtn) {
    chatToggleBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openChat();
    });
  }

  if (chatCloseBtn) {
    chatCloseBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeChat();
    });
  }

  // Handle escape key to close chat
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isChatOpen) {
      closeChat();
    }
  });

  // Handle click outside chat to close (optional)
  document.addEventListener("click", function (e) {
    if (
      isChatOpen &&
      !chatSection.contains(e.target) &&
      !chatToggleBtn.contains(e.target)
    ) {
      // Uncomment the line below if you want clicking outside to close chat
      // closeChat();
    }
  });

  // Handle window resize for responsive behavior
  function handleResize() {
    const windowWidth = window.innerWidth;

    if (windowWidth <= 768) {
      // Mobile behavior - chat takes full screen
      if (isChatOpen) {
        videoSection.style.display = "none";
        if (urlInputSection) {
          urlInputSection.style.display = "none";
        }
      } else {
        videoSection.style.display = "block";
        if (urlInputSection) {
          urlInputSection.style.display = "block";
        }
      }
    } else {
      // Desktop behavior - show both elements
      videoSection.style.display = "block";
      if (urlInputSection) {
        urlInputSection.style.display = "block";
      }
    }
  }

  // Add resize event listener
  window.addEventListener("resize", handleResize);

  // Enhanced chat functionality
  function enhanceChatExperience() {
    const chatBoard = document.getElementById("chatBoard");
    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chat");

    // Auto-scroll to bottom of chat when new messages arrive
    function scrollToBottom() {
      if (chatBoard) {
        chatBoard.scrollTop = chatBoard.scrollHeight;
      }
    }

    // Observer for new chat messages
    if (chatBoard) {
      const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
            scrollToBottom();
          }
        });
      });

      observer.observe(chatBoard, {
        childList: true,
        subtree: true,
      });
    }

    // Enhanced form submission - integrate with existing app.js functionality
    if (chatForm) {
      // Don't add another submit listener - app.js already handles it
      // Just ensure chat is visible when user starts typing
      if (chatInput) {
        chatInput.addEventListener("focus", function () {
          if (!isChatOpen) {
            openChat();
          }
        });
      }
    }

    // Chat input enhancements
    if (chatInput) {
      // Auto-resize input based on content
      chatInput.addEventListener("input", function () {
        this.style.height = "auto";
        this.style.height = Math.min(this.scrollHeight, 120) + "px";
      });

      // Handle Enter key (without Shift) to send message
      chatInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (chatForm) {
            chatForm.dispatchEvent(new Event("submit"));
          }
        }
      });
    }
  }

  // Notification system for new messages when chat is closed
  function setupChatNotifications() {
    const chatBoard = document.getElementById("chatBoard");
    let unreadCount = 0;

    if (chatBoard) {
      const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
            // New message arrived
            if (!isChatOpen) {
              unreadCount++;
              updateToggleButton();
            }
          }
        });
      });

      observer.observe(chatBoard, {
        childList: true,
        subtree: true,
      });
    }

    function updateToggleButton() {
      if (chatToggleBtn) {
        const badge = chatToggleBtn.querySelector(".notification-badge");
        if (unreadCount > 0) {
          if (!badge) {
            const newBadge = document.createElement("span");
            newBadge.className = "notification-badge";
            newBadge.textContent = unreadCount > 99 ? "99+" : unreadCount;
            chatToggleBtn.appendChild(newBadge);
          } else {
            badge.textContent = unreadCount > 99 ? "99+" : unreadCount;
          }
        } else {
          if (badge) {
            badge.remove();
          }
        }
      }
    }

    // Reset unread count when chat is opened
    function resetUnreadCount() {
      unreadCount = 0;
      updateToggleButton();
    }

    // Override the openChat function to reset unread count
    const originalOpenChat = openChat;
    openChat = function () {
      originalOpenChat();
      resetUnreadCount();
    };
  }

  // Initialize everything
  initializeChatState();
  enhanceChatExperience();
  setupChatNotifications();
  handleResize(); // Initial resize check

  // Public API for other scripts to interact with chat
  window.AdminChat = {
    open: openChat,
    close: closeChat,
    toggle: toggleChat,
    isOpen: () => isChatOpen,
  };

  // Debug logging (remove in production)
  console.log("Admin chat sidebar initialized");
});
