// auth.js
function initializeAuth() {
  if (typeof supabase === "undefined") {
    console.error("Supabase library not loaded. Retrying...");
    setTimeout(initializeAuth, 100);
    return;
  }

  // Supabase client configuration
  const supabaseClient = supabase.createClient(
    "https://qyvqsuwtvqrcjcvqigdl.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5dnFzdXd0dnFyY2pjdnFpZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0Mzc3MjMsImV4cCI6MjA2NTAxMzcyM30.rbQsNrfmhHjXnnOc8UAFTrknEKYkXDuKcP-IMPm5TdI"
  );

  // Authentication state management
  class AuthManager {
    constructor() {
      this.currentUser = null;
      this.supabaseClient = supabaseClient;
      this.googleAccessToken = null;
      this.init();
    }

    async init() {
      try {
        const {
          data: { session },
          error,
        } = await supabaseClient.auth.getSession();

        if (error) {
          console.error("Error fetching session:", error);
          return;
        }

        if (session) {
          this.currentUser = session.user;
          this.googleAccessToken = session.provider_token;
          console.log("Provider token:", this.googleAccessToken);
        } else {
          console.log("No session found, user not authenticated");
          // Optionally redirect to login page
          // window.location.href = "/index.html";
        }

        supabaseClient.auth.onAuthStateChange((event, session) => {
          this.currentUser = session?.user || null;
          this.googleAccessToken = session?.provider_token || null;
          console.log("Provider token updated:", this.googleAccessToken);
          if (!session) {
            console.log("Session ended, user not authenticated");
            // Optionally redirect to login page
            // window.location.href = "/index.html";
          }
          this.updateUI();
        });

        this.updateUI();
      } catch (error) {
        console.error("Error in AuthManager.init:", error);
      }
    }

    updateUI() {
      // Skip UI updates for admin.html since loginLink and userDropdown are not needed
      if (window.location.pathname.includes("admin.html")) {
        console.log("Skipping UI update for admin.html");
        return;
      }

      const loginLink = document.getElementById("loginLink");
      const userDropdown = document.getElementById("userDropdown");

      if (!loginLink && !userDropdown) {
        console.log(
          "UI elements (loginLink, userDropdown) not found, skipping UI update"
        );
        return;
      }

      if (this.currentUser) {
        if (loginLink) loginLink.style.display = "none";
        if (userDropdown) userDropdown.style.display = "block";
        this.updateUserDropdown();
      } else {
        if (loginLink) loginLink.style.display = "block";
        if (userDropdown) userDropdown.style.display = "none";
      }
    }

    updateUserDropdown() {
      // Skip for admin.html
      if (window.location.pathname.includes("admin.html")) {
        console.log("Skipping user dropdown update for admin.html");
        return;
      }

      const userAvatar = document.getElementById("userAvatar");
      const userDropdownAvatar = document.getElementById("userDropdownAvatar");
      const userName = document.getElementById("userName");
      const userEmail = document.getElementById("userEmail");
      const userBtn = document.getElementById("userDropdownBtn");

      if (!userAvatar || !userName || !userEmail || !userBtn) {
        console.log("User dropdown elements not found, skipping update");
        return;
      }

      if (this.currentUser) {
        const displayName =
          this.currentUser.user_metadata?.username ||
          this.currentUser.user_metadata?.name ||
          this.currentUser.email.split("@")[0];

        userName.textContent = displayName;
        userEmail.textContent = this.currentUser.email;

        const avatarUrl =
          this.currentUser.user_metadata?.avatar_url ||
          this.currentUser.user_metadata?.picture;

        if (avatarUrl) {
          userAvatar.src = avatarUrl;
          if (userDropdownAvatar) userDropdownAvatar.src = avatarUrl;
          userAvatar.style.display = "block";
          userBtn.classList.add("has-avatar");
          userBtn.classList.remove("letter-avatar");

          userAvatar.onerror = () => {
            this.createLetterAvatar(
              displayName.charAt(0).toUpperCase(),
              userAvatar,
              userBtn
            );
          };
          if (userDropdownAvatar) {
            userDropdownAvatar.onerror = () => {
              this.createLetterAvatar(
                displayName.charAt(0).toUpperCase(),
                userDropdownAvatar
              );
            };
          }
        } else {
          const firstLetter = displayName.charAt(0).toUpperCase();
          this.createLetterAvatar(firstLetter, userAvatar, userBtn);
          if (userDropdownAvatar) {
            this.createLetterAvatar(firstLetter, userDropdownAvatar);
          }
        }
      }
    }

    createLetterAvatar(letter, imgElement, buttonElement = null) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const size = 100;

      canvas.width = size;
      canvas.height = size;

      const colors = [
        "#FF6B6B",
        "#4ECDC4",
        "#45B7D1",
        "#96CEB4",
        "#FFEAA7",
        "#DDA0DD",
        "#98D8C8",
        "#F093FB",
        "#F5576C",
        "#4FACFE",
      ];
      const colorIndex = letter.charCodeAt(0) % colors.length;

      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, colors[colorIndex]);
      gradient.addColorStop(1, this.darkenColor(colors[colorIndex], 20));

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 45px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(letter, size / 2, size / 2);

      const dataURL = canvas.toDataURL();
      imgElement.src = dataURL;
      imgElement.style.display = "block";

      if (buttonElement) {
        buttonElement.classList.add("has-avatar");
        buttonElement.classList.remove("letter-avatar");
      }
    }

    darkenColor(color, percent) {
      const hex = color.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);

      return `rgb(${Math.max(0, r - (r * percent) / 100)}, ${Math.max(
        0,
        g - (g * percent) / 100
      )}, ${Math.max(0, b - (b * percent) / 100)})`;
    }

    async signOut() {
      try {
        const { error } = await this.supabaseClient.auth.signOut();
        if (error) throw error;
        window.location.href = "/index.html";
      } catch (error) {
        console.error("Error signing out:", error);
        alert("Error signing out: " + error.message);
      }
    }
  }

  console.log("Initializing AuthManager");
  window.authManager = new AuthManager();
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing auth");
  initializeAuth();
});
