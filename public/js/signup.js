// Signup page functionality
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

  // Signup form submission
  document
    .getElementById("signupForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      const username = document.getElementById("username").value;

      if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      try {
        const { data, error } = await supabaseClient.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              username: username,
            },
          },
        });

        if (error) throw error;

        alert("Sign up successful! Please check your email for verification.");
        window.location.href = "/login.html";
      } catch (error) {
        alert("Sign up failed: " + error.message);
      }
    });
});
