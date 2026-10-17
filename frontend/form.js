document.addEventListener("DOMContentLoaded", () => {
  const signInPanel = document.getElementById("signin-panel");
  const signUpPanel = document.getElementById("signup-panel");
  if (!signInPanel || !signUpPanel) return;

  const setMode = (mode) => {
    const isSignIn = mode === "signin";
    signInPanel.hidden = !isSignIn;
    signUpPanel.hidden = isSignIn;
    document.title = isSignIn
      ? "Sign in | SafeSouth Africa"
      : "Create an account | SafeSouth Africa";
  };

  document.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-auth-mode]");
    if (toggle) setMode(toggle.dataset.authMode);
  });

  setMode(new URLSearchParams(window.location.search).get("signin") === "1" ? "signin" : "signup");
});
