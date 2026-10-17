document.addEventListener("DOMContentLoaded", () => {
  const signupLink = document.querySelector(".switch-text a");
  if (!signupLink) return;

  const pages = new Set([
    "index.html",
    "about.html",
    "contact.html",
    "resources.html",
    "hotspot.html",
    "community-chat.html",
    "interactive_map/index.html",
    "chatbot/index.html",
  ]);
  const requestedPage = new URLSearchParams(window.location.search).get("next");
  const nextPage = pages.has(requestedPage) ? requestedPage : "index.html";
  const authScript = document.querySelector('script[src$="auth.js"]');
  if (!authScript) return;

  const signInUrl = new URL("index.html", authScript.src);
  signInUrl.searchParams.set("signin", "1");
  signInUrl.searchParams.set("next", nextPage);
  signupLink.href = signInUrl.href;
});
