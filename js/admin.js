
/* HCM Lite - Admin Dashboard */

// Check Authentication
const currentAdmin = requireAuth("admin");

// Run Dashboard Only For Admin
if (currentAdmin) {

    // Get HTML Elements
    const sidebarAdminName = document.getElementById("sidebar-admin-name");
    const topAdminName = document.getElementById("top-admin-name");
    const adminAvatar = document.getElementById("admin-avatar");
    const logoutButton = document.getElementById("logout-btn");

    // Show Admin Name
    sidebarAdminName.textContent = currentAdmin.name;
    topAdminName.textContent = currentAdmin.name;

    // Show First Letter Of Name
    adminAvatar.textContent = currentAdmin.name.charAt(0).toUpperCase();

    // Logout Functionality
    logoutButton.addEventListener("click", function (event) {
        event.preventDefault();

        logoutUser();
    });

}
