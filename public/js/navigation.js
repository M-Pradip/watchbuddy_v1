// Navigation and UI management
class NavigationManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupUserDropdown();
    this.setupSignOutButton();
  }

  setupUserDropdown() {
    const userDropdownBtn = document.getElementById("userDropdownBtn");
    const userDropdownContent = document.getElementById("userDropdownContent");

    if (userDropdownBtn && userDropdownContent) {
      // Toggle dropdown on button click
      userDropdownBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        userDropdownContent.classList.toggle("show");
      });

      // Close dropdown when clicking outside
      document.addEventListener("click", (e) => {
        if (
          !userDropdownBtn.contains(e.target) &&
          !userDropdownContent.contains(e.target)
        ) {
          userDropdownContent.classList.remove("show");
        }
      });

      // Close dropdown when pressing escape
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          userDropdownContent.classList.remove("show");
        }
      });
    }
  }

  setupSignOutButton() {
    const signOutBtn = document.getElementById("signOutBtn");
    if (signOutBtn) {
      signOutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        if (window.authManager) {
          await window.authManager.signOut();
        }
      });
    }
  }
}

// Initialize navigation manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new NavigationManager();
});
