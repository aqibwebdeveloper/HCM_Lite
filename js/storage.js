
/* HCM Lite - LocalStorage Helpers */

const STORAGE_KEYS = {
    company: "hcm_company",
    users: "hcm_users",
    attendance: "hcm_attendance",
    leaves: "hcm_leaves",
    session: "hcm_session"
};

// Get Data
function getData(key, defaultValue = []) {
    const data = localStorage.getItem(key);

    if (data === null) {
        return defaultValue;
    }

    try {
        return JSON.parse(data);
    } catch (error) {
        console.error("Invalid storage data:", key);
        return defaultValue;
    }
}

// Save Data
function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// Get All Users
function getUsers() {
    return getData(STORAGE_KEYS.users, []);
}

// Save All Users
function saveUsers(users) {
    saveData(STORAGE_KEYS.users, users);
}

// Get Current Session
function getSession() {
    return getData(STORAGE_KEYS.session, null);
}

// Save Current Session
function saveSession(user) {
    saveData(STORAGE_KEYS.session, {
        userId: user.id,
        role: user.role
    });
}

// Remove Session
function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.session);
}
