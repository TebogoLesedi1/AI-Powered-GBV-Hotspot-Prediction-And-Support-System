/* =========================================
   DONATE PAGE — Amount picker
   ========================================= */

document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("donation-form");
    if (!form) return;

    const amountButtons = document.querySelectorAll(".amount-btn");
    const customInput   = document.getElementById("customAmount");
    const summaryAmount = document.getElementById("summaryAmount");


    function formatRands(value) {
        const n = Number(value) || 0;
        return "R" + n.toLocaleString("en-ZA");
    }


    function updateSummary() {
        const selected = document.querySelector(".amount-btn.selected");
        const value =
            customInput.value && Number(customInput.value) > 0
                ? customInput.value
                : selected
                    ? selected.dataset.amount
                    : 0;

        summaryAmount.textContent = formatRands(value);
    }


    // Preset buttons
    amountButtons.forEach(button => {

        button.addEventListener("click", function () {

            amountButtons.forEach(b => b.classList.remove("selected"));
            button.classList.add("selected");

            customInput.value = ""; // clear custom when preset chosen
            updateSummary();

        });

    });


    // Custom amount input
    customInput.addEventListener("input", function () {

        if (customInput.value) {
            amountButtons.forEach(b => b.classList.remove("selected"));
        }

        updateSummary();

    });


    // Submit
    form.addEventListener("submit", function (event) {

        event.preventDefault();

        const selected = document.querySelector(".amount-btn.selected");
        const value =
            customInput.value && Number(customInput.value) > 0
                ? customInput.value
                : selected
                    ? selected.dataset.amount
                    : null;

        if (!value) {
            alert("Please choose an amount or enter your own.");
            return;
        }

        const email = document.getElementById("email").value.trim();
        if (!email || !email.includes("@")) {
            alert("Please enter a valid email address so we can send you a receipt.");
            return;
        }

        alert(
            "Thank you for your generosity!\n\n" +
            "You are donating " + formatRands(value) + ".\n" +
            "A confirmation would be sent to " + email + ".\n\n" +
            "(This is a prototype — no payment was processed.)"
        );

        form.reset();
        amountButtons.forEach(b => b.classList.remove("selected"));
        summaryAmount.textContent = "R0";

    });

});