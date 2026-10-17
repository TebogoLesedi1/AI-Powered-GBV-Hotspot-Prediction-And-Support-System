document.addEventListener("DOMContentLoaded", () => {
  const loginBox = document.getElementById("login-box");
  const signupBox = document.getElementById("signup-box");

  document.addEventListener("click", (e) => {
    if (e.target.id === "go-to-signup") {
      e.preventDefault();
      loginBox.classList.add("hidden");
      signupBox.classList.remove("hidden");
    }
    if (e.target.id === "go-to-login") {
      e.preventDefault();
      signupBox.classList.add("hidden");
      loginBox.classList.remove("hidden");
    }
  });

  // stop page from reloading
  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      alert("Form works! Now you can add backend logic");
    });
  });
});
