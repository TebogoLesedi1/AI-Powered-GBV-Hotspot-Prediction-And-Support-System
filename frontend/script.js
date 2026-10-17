// =========================================
// WAIT FOR DOM TO LOAD
// =========================================

document.addEventListener("DOMContentLoaded", function () {
    const signInDialog = document.getElementById("signin-dialog");
    const openSignIn = document.getElementById("openSignIn");
    const closeSignIn = document.getElementById("closeSignIn");
    const signInForm = document.getElementById("signin-form");

    if (signInDialog && openSignIn && closeSignIn) {
        openSignIn.addEventListener("click", function () {
            signInDialog.showModal();
        });

        closeSignIn.addEventListener("click", function () {
            signInDialog.close();
        });

        signInDialog.addEventListener("click", function (event) {
            if (event.target === signInDialog) signInDialog.close();
        });
    }

    if (signInForm) {
        signInForm.addEventListener("submit", function (event) {
            event.preventDefault();
            alert("Sign-in is ready to connect to an authentication service.");
        });
    }

    // =========================================
    // GET MENU ELEMENTS
    // =========================================

    const hamburger   = document.getElementById("hamburger");
    const sideMenu    = document.getElementById("sideMenu");
    const closeMenu   = document.getElementById("closeMenu");
    const menuOverlay = document.getElementById("menuOverlay");

    // If the hamburger doesn't exist on this page, stop.
    if (!hamburger || !sideMenu || !menuOverlay) return;


    // =========================================
    // OPEN MENU
    // =========================================

    hamburger.addEventListener("click", function () {

        sideMenu.classList.add("active");
        menuOverlay.classList.add("active");
        document.body.classList.add("menu-open");
        hamburger.setAttribute("aria-expanded", "true");

    });


    // =========================================
    // CLOSE MENU (via X button)
    // =========================================

    if (closeMenu) {

        closeMenu.addEventListener("click", function () {

            sideMenu.classList.remove("active");
            menuOverlay.classList.remove("active");
            document.body.classList.remove("menu-open");
            hamburger.setAttribute("aria-expanded", "false");

        });

    }


    // =========================================
    // CLOSE MENU WHEN CLICKING OUTSIDE
    // =========================================

    menuOverlay.addEventListener("click", function () {

        sideMenu.classList.remove("active");
        menuOverlay.classList.remove("active");
        document.body.classList.remove("menu-open");
        hamburger.setAttribute("aria-expanded", "false");

    });


    // =========================================
    // CLOSE MENU AFTER CLICKING A LINK
    // =========================================

    const menuLinks = document.querySelectorAll(".mobile-navigation a");

    menuLinks.forEach(function (link) {

        link.addEventListener("click", function () {

            sideMenu.classList.remove("active");
            menuOverlay.classList.remove("active");
            document.body.classList.remove("menu-open");
            hamburger.setAttribute("aria-expanded", "false");

        });

    });

});
