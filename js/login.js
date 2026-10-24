
/* HCM Lite - Login & Setup UI */

// Get Elements
const loginTab = document.getElementById("login-tab");
const setupTab = document.getElementById("setup-tab");

const loginSection = document.getElementById("login-section");
const setupSection = document.getElementById("setup-section");

const loginForm = document.getElementById("login-form");
const setupForm = document.getElementById("setup-form");

const loginError = document.getElementById("login-error");
const setupError = document.getElementById("setup-error");


// Show Login Form
function showLogin() {
    loginSection.hidden = false;
    setupSection.hidden = true;

    loginTab.classList.add("active");
    setupTab.classList.remove("active");

    loginError.textContent = "";
}


// Show Setup Form
function showSetup() {
    if (isSetupComplete()) {
        showLogin();
        return;
    }

    loginSection.hidden = true;
    setupSection.hidden = false;

    setupTab.classList.add("active");
    loginTab.classList.remove("active");

    setupError.textContent = "";
}


// Handle Tabs
loginTab.addEventListener("click", function (event) {
    event.preventDefault();
    showLogin();
});

setupTab.addEventListener("click", function (event) {
    event.preventDefault();
    showSetup();
});


// Handle Login Form
loginForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const result = loginUser(email, password);

    if (result.success) {
        redirectUser(result.user);
    } else {
        loginError.textContent = result.message;
    }

});


// Handle Setup Form
setupForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const company = document.getElementById("company").value;
    const name = document.getElementById("admin-name").value;
    const email = document.getElementById("admin-email").value;
    const password = document.getElementById("admin-pass").value;

    const result = setupAdmin(company, name, email, password);

    if (result.success) {
        redirectUser(result.user);
    } else {
        setupError.textContent = result.message;
    }

});


// Check Setup / Session On Page Load
function initializeLoginPage() {

    const user = getCurrentUser();

    if (user) {
        redirectUser(user);
        return;
    }

    if (isSetupComplete()) {
        showLogin();
        setupTab.hidden = true;
    } else {
        setupTab.hidden = false;
        showSetup();
    }

}

initializeLoginPage();
