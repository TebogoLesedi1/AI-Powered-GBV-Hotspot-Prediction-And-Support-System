document.addEventListener("DOMContentLoaded", async () => {
  const config = window.FIREBASE_CONFIG;
  const signInDialog = document.getElementById("signin-dialog");
  const signInForm = document.getElementById("signin-form");
  const signInMessage = document.getElementById("signin-message");
  const signUpForm = document.getElementById("signup-form");
  const signUpMessage = document.getElementById("signup-message");
  const closeSignIn = document.getElementById("closeSignIn");
  const authScript = document.querySelector('script[src$="auth.js"]');
  const homeUrl = new URL("index.html", authScript.src);
  const siteRoot = new URL(".", homeUrl);
  const publicPages = new Set([
    "index.html",
    "about.html",
    "contact.html",
    "resources.html",
    "hotspot.html",
    "community-chat.html",
    "interactive_map/index.html",
    "chatbot/index.html",
  ]);
  const currentPage = decodeURIComponent(
    window.location.pathname.slice(siteRoot.pathname.length),
  );
  const requestedPage = new URLSearchParams(window.location.search).get("next");
  const nextPage = publicPages.has(requestedPage)
    ? requestedPage
    : publicPages.has(currentPage)
      ? currentPage
      : "index.html";
  let isCreatingAccount = false;

  const showMessage = (node, text, isError = false) => {
    if (!node) return;
    node.textContent = text;
    node.classList.toggle("is-error", isError);
  };

  const destinationUrl = () => new URL(nextPage, siteRoot);

  const returnToDestination = () => {
    const destination = destinationUrl();
    if (destination.pathname === window.location.pathname) {
      window.history.replaceState(null, "", destination.href);
      if (signInDialog?.open) signInDialog.close();
      showMessage(signInMessage, "You are signed in.");
      return;
    }
    window.location.assign(destination);
  };

  const configureSignUpLink = () => {
    const signUpLink = document.querySelector("#signin-dialog .auth-switch a");
    if (signUpLink) {
      signUpLink.href = new URL(
        `signup.html?next=${encodeURIComponent(nextPage)}`,
        siteRoot,
      ).href;
    }
  };

  const openSignInDialog = () => {
    if (signInDialog && !signInDialog.open) signInDialog.showModal();
  };

  const openSignIn = document.getElementById("openSignIn");
  if (openSignIn && signInDialog) {
    openSignIn.onclick = openSignInDialog;
  }

  const openRequestedSignInDialog = () => {
    if (
      signInDialog &&
      typeof signInDialog.showModal === "function" &&
      new URLSearchParams(window.location.search).get("signin") === "1"
    ) {
      signInDialog.showModal();
    }
  };

  if (signInDialog && closeSignIn) {
    closeSignIn.addEventListener("click", () => signInDialog.close());
    signInDialog.addEventListener("click", (event) => {
      if (event.target === signInDialog) signInDialog.close();
    });
  }

  configureSignUpLink();

  if (
    !config ||
    !config.apiKey ||
    config.apiKey === "YOUR_FIREBASE_WEB_API_KEY" ||
    !config.authDomain ||
    config.authDomain.startsWith("YOUR_") ||
    !config.projectId ||
    config.projectId.startsWith("YOUR_") ||
    !config.appId ||
    config.appId.startsWith("YOUR_") ||
    !window.firebase?.auth
  ) {
    signInForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      showMessage(signInMessage, "Sign-in is unavailable.", true);
    });
    signUpForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      showMessage(signUpMessage, "Sign-up is unavailable.", true);
    });
    openRequestedSignInDialog();
    return;
  }

  let auth;
  try {
    if (!window.firebase.apps.length) window.firebase.initializeApp(config);
    auth = window.firebase.auth();
  } catch (error) {
    console.error("Could not initialize Firebase Authentication.", error);
    signInForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      showMessage(signInMessage, "Sign-in is unavailable.", true);
    });
    signUpForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      showMessage(signUpMessage, "Sign-up is unavailable.", true);
    });
    openRequestedSignInDialog();
    return;
  }

  window.safeSouthAuth = auth;

  const addAccountControl = (user) => {
    const header = document.querySelector(".header");
    if (!header) return;

    let control =
      document.getElementById("account-control") ||
      document.getElementById("openSignIn");
    if (!control) {
      control = document.createElement("button");
      control.id = "account-control";
      control.className = "sign-in-trigger";
      control.type = "button";
      const hamburger = header.querySelector(".hamburger");
      header.insertBefore(control, hamburger || null);
    }

    control.textContent = user ? "Sign out" : "Sign in";
    control.setAttribute("aria-label", user ? "Sign out" : "Sign in");
    if (control.id === "openSignIn" && !user) {
      control.onclick = openSignInDialog;
      return;
    }

    control.onclick = async () => {
      if (!user) {
        if (signInDialog && typeof signInDialog.showModal === "function") {
          signInDialog.showModal();
        } else {
          const signInUrl = new URL(homeUrl);
          signInUrl.searchParams.set("signin", "1");
          signInUrl.searchParams.set("next", nextPage);
          window.location.assign(signInUrl);
        }
        return;
      }

      try {
        await auth.signOut();
        showMessage(signInMessage, "You have signed out.");
      } catch (error) {
        if (signInMessage) showMessage(signInMessage, error.message, true);
        else window.alert(`Could not sign out: ${error.message}`);
      }
    };
  };

  addAccountControl(null);

  try {
    await auth.setPersistence(window.firebase.auth.Auth.Persistence.LOCAL);
  } catch (error) {
    console.error("Could not enable persistent sign-in.", error);
    showMessage(signInMessage, "Your sign-in may not be saved.", true);
    showMessage(signUpMessage, "Your sign-in may not be saved.", true);
  }

  if (signInForm) {
    signInForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = signInForm.querySelector('button[type="submit"]');
      button.disabled = true;
      showMessage(signInMessage, "Signing in…");

      try {
        const formData = new FormData(signInForm);
        await auth.signInWithEmailAndPassword(
          formData.get("email"),
          formData.get("password"),
        );
        returnToDestination();
      } catch (error) {
        showMessage(signInMessage, error.message, true);
      } finally {
        button.disabled = false;
      }
    });
  }

  if (signUpForm) {
    signUpForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = signUpForm.querySelector('button[type="submit"]');
      button.disabled = true;
      showMessage(signUpMessage, "Creating your account…");

      try {
        const formData = new FormData(signUpForm);
        isCreatingAccount = true;
        const credential = await auth.createUserWithEmailAndPassword(
          formData.get("email"),
          formData.get("password"),
        );
        await credential.user.updateProfile({
          displayName: formData.get("name"),
        });
        returnToDestination();
      } catch (error) {
        isCreatingAccount = false;
        showMessage(signUpMessage, error.message, true);
      } finally {
        button.disabled = false;
      }
    });
  }

  auth.onAuthStateChanged(
    (user) => {
      addAccountControl(user);
      if (user && signUpForm && !isCreatingAccount) returnToDestination();
    },
    (error) => {
      showMessage(signInMessage, `Could not restore your sign-in: ${error.message}`, true);
      showMessage(signUpMessage, `Could not restore your sign-in: ${error.message}`, true);
    },
  );

  openRequestedSignInDialog();
});
