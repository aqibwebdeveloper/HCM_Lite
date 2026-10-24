
/* HCM Lite - Company Settings */

const settingsAdmin = requireAuth("admin");

if (settingsAdmin) {

    // HTML Elements
    const settingsForm = document.getElementById("settings-form");

    const companyInput = document.getElementById("company");
    const startTimeInput = document.getElementById("start");
    const graceInput = document.getElementById("grace");
    const workingDaysInput = document.getElementById("days");
    const quotaInput = document.getElementById("quota");

    const settingsMessage = document.getElementById("settings-message");

    const sidebarAdminName =
        document.getElementById("sidebar-admin-name");

    const topAdminName =
        document.getElementById("top-admin-name");

    const adminAvatar =
        document.getElementById("admin-avatar");

    const logoutButton =
        document.getElementById("logout-btn");


    // Show logged-in Admin
    sidebarAdminName.textContent = settingsAdmin.name;
    topAdminName.textContent = settingsAdmin.name;

    adminAvatar.textContent =
        settingsAdmin.name.charAt(0).toUpperCase();


    // Load saved company settings
    function loadSettings() {

        const company = getData(STORAGE_KEYS.company, {});

        companyInput.value = company.name || "";

        startTimeInput.value = company.startTime || "09:00";

        graceInput.value = company.graceMinutes ?? 15;

        quotaInput.value = company.leaveQuota ?? 20;

        const workingDays = Array.isArray(company.workingDays)
            ? company.workingDays
            : [1, 2, 3, 4, 5];

        // If Saturday is included, select Monday-Saturday
        if (workingDays.includes(6)) {

            workingDaysInput.value = "mon-sat";

        } else {

            workingDaysInput.value = "mon-fri";
        }

    }


    // Show success or error message
    function showMessage(text, type = "error") {

        settingsMessage.textContent = text;

        settingsMessage.className = text
            ? "form-message " + type
            : "form-message";
    }


    // Save settings
    settingsForm.addEventListener("submit", function (event) {

        event.preventDefault();

        showMessage("");

        const companyName = companyInput.value.trim();
        const officeStartTime = startTimeInput.value;

        const graceMinutes = Number(graceInput.value);
        const leaveQuota = Number(quotaInput.value);


        // Validate company name
        if (!companyName) {

            showMessage("Please enter the company name.");

            companyInput.focus();

            return;
        }


        // Validate office start time
        if (!officeStartTime) {

            showMessage("Please select the office start time.");

            startTimeInput.focus();

            return;
        }


        // Validate grace minutes
        if (
            graceInput.value.trim() === "" ||
            !Number.isInteger(graceMinutes) ||
            graceMinutes < 0
        ) {

            showMessage(
                "Grace minutes must be a whole number equal to or greater than zero."
            );

            graceInput.focus();

            return;
        }


        // Validate leave quota
        if (
            quotaInput.value.trim() === "" ||
            !Number.isInteger(leaveQuota) ||
            leaveQuota < 0
        ) {

            showMessage(
                "Yearly leave quota must be a whole number equal to or greater than zero."
            );

            quotaInput.focus();

            return;
        }


        // Convert selected option into JavaScript weekdays.
        // Sunday = 0, Monday = 1, ..., Saturday = 6.

        let workingDays;

        if (workingDaysInput.value === "mon-sat") {

            workingDays = [1, 2, 3, 4, 5, 6];

        } else {

            workingDays = [1, 2, 3, 4, 5];
        }


        // Preserve any other company properties already saved
        const existingCompany = getData(
            STORAGE_KEYS.company,
            {}
        );

        const updatedCompany = {

            ...existingCompany,

            name: companyName,

            startTime: officeStartTime,

            graceMinutes: graceMinutes,

            leaveQuota: leaveQuota,

            workingDays: workingDays

        };


        // Save to localStorage
        try {

            saveData(
                STORAGE_KEYS.company,
                updatedCompany
            );

            showMessage(
                "Company settings saved successfully!",
                "success"
            );

        } catch (error) {

            console.error(
                "Could not save company settings:",
                error
            );

            showMessage(
                "Settings could not be saved. Check browser storage and try again."
            );
        }

    });


    // Logout
    logoutButton.addEventListener("click", function (event) {

        event.preventDefault();

        logoutUser();

    });


    // Load saved values when page opens
    loadSettings();

}
