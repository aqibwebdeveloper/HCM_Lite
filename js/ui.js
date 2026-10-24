
/* HCM Lite - UI JavaScript */

// Select HTML Elements
const menuButton = document.querySelector("[data-menu]");
const sidebar = document.querySelector(".sidebar");
const overlay = document.querySelector(".mobile-overlay");

// Close Sidebar Function
function closeMenu() {
    sidebar?.classList.remove("open");
    overlay?.classList.remove("show");

    menuButton?.setAttribute("aria-expanded", "false");
}

// Open / Close Sidebar
menuButton?.addEventListener("click", function () {

    const open = sidebar.classList.toggle("open");

    overlay?.classList.toggle("show", open);

    menuButton.setAttribute("aria-expanded", String(open));

});

// Close Sidebar When Overlay Clicked
overlay?.addEventListener("click", closeMenu);

// Close Sidebar When Escape Key Pressed
document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {
        closeMenu();
    }

});

// Print Payslip
document.querySelectorAll("[data-print]").forEach(function (button) {

    button.addEventListener("click", function () {
        window.print();
    });

});
