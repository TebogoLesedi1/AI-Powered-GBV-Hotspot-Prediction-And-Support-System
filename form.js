let isSignup = true;

const title = document.getElementById("form-title");
const signupArea = document.getElementById("signup-form-area");
const loginArea = document.getElementById("login-form-area");
const mainBtn = document.getElementById("main-action-btn");
const toggleLink = document.getElementById("toggle-form");
const switchText = document.getElementById("switch-text");
const errorMsg = document.getElementById("error-msg");
const loginErrorMsg = document.getElementById("login-error-msg");

function showError(el, msg) {
  el.textContent = msg;
  el.style.display = "block";
}
function hideError(el) {
  el.style.display = "none";
}

toggleLink.addEventListener("click", (e) => {
  e.preventDefault();
  isSignup = !isSignup;

  if (isSignup) {
    title.textContent = "Sign Up";
    signupArea.classList.remove("hidden");
    loginArea.classList.add("hidden");
    mainBtn.textContent = "Sign Up";
    switchText.innerHTML = `Already have an account? <a href="#" id="toggle-form">Log in</a>`;
  } else {
    title.textContent = "Log In";
    signupArea.classList.add("hidden");
    loginArea.classList.remove("hidden");
    mainBtn.textContent = "Log In";
    switchText.innerHTML = `Don't have an account? <a href="#" id="toggle-form">Sign up</a>`;
  }
  // re-attach listener because innerHTML changed
  document
    .getElementById("toggle-form")
    .addEventListener("click", toggleLink.onclick || arguments.callee);
  hideError(errorMsg);
  hideError(loginErrorMsg);
});

// Need to handle dynamic toggle link - use delegation
document.addEventListener("click", (e) => {
  if (e.target.id === "toggle-form") {
    e.preventDefault();
    isSignup = !isSignup;
    if (isSignup) {
      title.textContent = "Sign Up";
      signupArea.classList.remove("hidden");
      loginArea.classList.add("hidden");
      mainBtn.textContent = "Sign Up";
      document.getElementById("switch-text").innerHTML =
        `Already have an account? <a href="#" id="toggle-form">Log in</a>`;
    } else {
      title.textContent = "Log In";
      signupArea.classList.add("hidden");
      loginArea.classList.remove("hidden");
      mainBtn.textContent = "Log In";
      document.getElementById("switch-text").innerHTML =
        `Don't have an account? <a href="#" id="toggle-form">Sign up</a>`;
    }
  }
});

mainBtn.addEventListener("click", () => {
  if (isSignup) {
    // SIGN UP LOGIC
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;

    hideError(errorMsg);

    if (!name || !email || !pass || !confirm) {
      showError(errorMsg, "Please fill all fields");
      return;
    }
    if (pass !== confirm) {
      showError(errorMsg, "Passwords do not match");
      return;
    }
    if (pass.length < 6) {
      showError(errorMsg, "Password must be at least 6 characters");
      return;
    }

    // SAVE USER (for demo - replace with fetch to backend)
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    if (users.find((u) => u.email === email)) {
      showError(errorMsg, "Email already registered");
      return;
    }
    users.push({ name, email, password: pass });
    localStorage.setItem("users", JSON.stringify(users));

    alert("Account created! Now log in.");
    isSignup = false;
    title.textContent = "Log In";
    signupArea.classList.add("hidden");
    loginArea.classList.remove("hidden");
    mainBtn.textContent = "Log In";
    document.getElementById("switch-text").innerHTML =
      `Don't have an account? <a href="#" id="toggle-form">Sign up</a>`;
  } else {
    // LOGIN LOGIC
    const email = document.getElementById("login-email").value.trim();
    const pass = document.getElementById("login-password").value;
    hideError(loginErrorMsg);

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const user = users.find((u) => u.email === email);

    if (!user) {
      showError(loginErrorMsg, "User not found");
      return;
    }
    if (user.password !== pass) {
      showError(loginErrorMsg, "Incorrect password");
      document.getElementById("login-password").classList.add("input-error");
      setTimeout(
        () =>
          document
            .getElementById("login-password")
            .classList.remove("input-error"),
        2000,
      );
      return;
    }

    alert(`Welcome back, ${user.name}!`);
    // window.location.href = '/dashboard.html';
  }
});
