document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signup-form");
  const message = document.getElementById("signup-message");

  if (!signupForm || !message) return;

  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    message.textContent =
      "The registration form is ready to connect to an account service.";
  });
});
