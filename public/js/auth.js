// Supabase client configuration
const supabaseClient = supabase.createClient(
  "https://qyvqsuwtvqrcjcvqigdl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5dnFzdXd0dnFyY2pjdnFpZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0Mzc3MjMsImV4cCI6MjA2NTAxMzcyM30.rbQsNrfmhHjXnnOc8UAFTrknEKYkXDuKcP-IMPm5TdI"
);

// Authentication state management
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.supabaseClient = supabaseClient; // Expose supabase client
    this.init();
  }

  async init() {
    // Check current session
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    if (session) {
      this.currentUser = session.user;
    }

    // Listen for auth changes
    supabaseClient.auth.onAuthStateChange((event, session) => {
      this.currentUser = session?.user || null;
      this.updateUI();
    });

    this.updateUI();
  }

  updateUI() {
    const loginLink = document.getElementById("loginLink");
    const userDropdown = document.getElementById("userDropdown");

    if (this.currentUser) {
      // User is logged in
      loginLink.style.display = "none";
      userDropdown.style.display = "block";
      this.updateUserDropdown();
    } else {
      // User is not logged in
      loginLink.style.display = "block";
      userDropdown.style.display = "none";
    }
  }

  updateUserDropdown() {
    const userAvatar = document.getElementById("userAvatar");
    const userDropdownAvatar = document.getElementById("userDropdownAvatar");
    const userName = document.getElementById("userName");
    const userEmail = document.getElementById("userEmail");
    const userBtn = document.getElementById("userDropdownBtn");

    if (this.currentUser) {
      // Update user info
      const displayName =
        this.currentUser.user_metadata?.username ||
        this.currentUser.user_metadata?.name ||
        this.currentUser.email.split("@")[0];

      userName.textContent = displayName;
      userEmail.textContent = this.currentUser.email;

      // Handle avatar
      const avatarUrl =
        this.currentUser.user_metadata?.avatar_url ||
        this.currentUser.user_metadata?.picture;

      if (avatarUrl) {
        // User has an avatar image
        userAvatar.src = avatarUrl;
        userDropdownAvatar.src = avatarUrl;
        userAvatar.style.display = "block";
        userBtn.classList.add("has-avatar");
        userBtn.classList.remove("letter-avatar");

        // Handle image load errors
        userAvatar.onerror = () => {
          this.createLetterAvatar(
            displayName.charAt(0).toUpperCase(),
            userAvatar,
            userBtn
          );
        };
        userDropdownAvatar.onerror = () => {
          this.createLetterAvatar(
            displayName.charAt(0).toUpperCase(),
            userDropdownAvatar
          );
        };
      } else {
        // No avatar image, show first letter of username/email
        const firstLetter = displayName.charAt(0).toUpperCase();
        this.createLetterAvatar(firstLetter, userAvatar, userBtn);
        this.createLetterAvatar(firstLetter, userDropdownAvatar);
      }
    }
  }

  createLetterAvatar(letter, imgElement, buttonElement = null) {
    // Create a canvas to generate letter avatar
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const size = 100;

    canvas.width = size;
    canvas.height = size;

    // Background colors array
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

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, colors[colorIndex]);
    gradient.addColorStop(1, this.darkenColor(colors[colorIndex], 20));

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Add subtle shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 45px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(letter, size / 2, size / 2);

    // Convert to data URL and set as image source
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

      // Redirect to home page
      window.location.href = "/index.html";
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Error signing out: " + error.message);
    }
  }
}

// Initialize auth manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.authManager = new AuthManager();
});
