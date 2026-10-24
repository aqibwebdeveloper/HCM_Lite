
/* HCM Lite - Authentication */

// Find User By Email
function findUserByEmail(email) {
    return getUsers().find(function (user) {
        return user.email.toLowerCase() === email.toLowerCase();
    });
}

// Check First-Time Setup
function isSetupComplete() {
    const company = getData(STORAGE_KEYS.company, null);

    const admin = getUsers().find(function (user) {
        return user.role === "admin";
    });

    return company !== null && admin !== undefined;
}

// Create Admin Account
function setupAdmin(companyName, name, email, password) {

    if (isSetupComplete() || getUsers().length > 0) {
        return {
            success: false,
            message: "Setup already completed!"
        };
    }

    companyName = companyName.trim();
    name = name.trim();
    email = email.trim().toLowerCase();

    if (!companyName || !name || !email || !password) {
        return {
            success: false,
            message: "All fields are required!"
        };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return {
            success: false,
            message: "Enter a valid email address!"
        };
    }

    if (password.length < 6) {
        return {
            success: false,
            message: "Password must contain at least 6 characters!"
        };
    }

    const admin = {
        id: Date.now(),
        name: name,
        email: email,
        password: password,
        role: "admin",
        department: "Administration",
        salary: 0
    };

    const company = {
        name: companyName,
        startTime: "09:00",
        graceMinutes: 15,
        leaveQuota: 20,
        workingDays: [1, 2, 3, 4, 5]
    };

    saveUsers([admin]);
    saveData(STORAGE_KEYS.company, company);
    saveSession(admin);

    return {
        success: true,
        message: "Admin account created successfully!",
        user: admin
    };
}

// Login User
function loginUser(email, password) {

    email = email.trim().toLowerCase();

    const user = findUserByEmail(email);

    if (!user || user.password !== password) {
        return {
            success: false,
            message: "Invalid email or password!"
        };
    }

    saveSession(user);

    return {
        success: true,
        message: "Login successful!",
        user: user
    };
}

// Get Logged-in User
function getCurrentUser() {

    const session = getSession();

    if (!session) {
        return null;
    }

    const user = getUsers().find(function (item) {
        return item.id === session.userId;
    });

    return user || null;
}

// Logout
function logoutUser() {
    clearSession();
    window.location.href = getLoginPath();
}

// Login Path Based On Page Location
function getLoginPath() {
    return window.location.pathname.includes("/pages/")
        ? "../index.html"
        : "index.html";
}

// Redirect After Login
function redirectUser(user) {

    const prefix = window.location.pathname.includes("/pages/")
        ? ""
        : "pages/";

    if (user.role === "admin") {
        window.location.href = prefix + "admin.html";
    } else {
        window.location.href = prefix + "employee.html";
    }
}

// Protect Pages Based On Role
function requireAuth(requiredRole) {

    const user = getCurrentUser();

    if (!user) {
        window.location.replace(getLoginPath());
        return null;
    }

    if (requiredRole && user.role !== requiredRole) {
        redirectUser(user);
        return null;
    }

    return user;
}
