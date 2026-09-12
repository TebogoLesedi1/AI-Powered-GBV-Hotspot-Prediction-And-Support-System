// =========================================
// WAIT FOR DOM TO LOAD
// =========================================

document.addEventListener("DOMContentLoaded", function () {

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

    });


    // =========================================
    // CLOSE MENU (via X button)
    // =========================================

    if (closeMenu) {

        closeMenu.addEventListener("click", function () {

            sideMenu.classList.remove("active");
            menuOverlay.classList.remove("active");
            document.body.classList.remove("menu-open");

        });

    }


    // =========================================
    // CLOSE MENU WHEN CLICKING OUTSIDE
    // =========================================

    menuOverlay.addEventListener("click", function () {

        sideMenu.classList.remove("active");
        menuOverlay.classList.remove("active");
        document.body.classList.remove("menu-open");

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

        });

    });

});

