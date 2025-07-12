// Login page functionality
document.addEventListener("DOMContentLoaded", () => {
  const supabaseClient = supabase.createClient(
    "https://qyvqsuwtvqrcjcvqigdl.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5dnFzdXd0dnFyY2pjdnFpZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0Mzc3MjMsImV4cCI6MjA2NTAxMzcyM30.rbQsNrfmhHjXnnOc8UAFTrknEKYkXDuKcP-IMPm5TdI"
  );

  // Check if user is already logged in
  const checkAuthStatus = async () => {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    if (session) {
      // User is already logged in, redirect to home
      window.location.href = "/index.html";
    }
  };

  checkAuthStatus();

  // Email/Password login
  document
    .getElementById("emailLoginForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (error) throw error;

        // Successful login
        window.location.href = "/index.html";
      } catch (error) {
        alert("Login failed: " + error.message);
      }
    });

  // Google OAuth login
  document.getElementById("googleLogin").addEventListener("click", async () => {
    try {
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/index.html",
        },
      });

      if (error) throw error;
    } catch (error) {
      alert("Google login failed: " + error.message);
    }
  });

  // Redirect to signup page
  document.getElementById("signupLink").addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "/signup.html";
  });
});
