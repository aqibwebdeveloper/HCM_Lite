
/* HCM Lite - Monthly Payslip */

const payslipSessionUser = requireAuth();

if (payslipSessionUser) {

    // HTML Elements
    const monthInput = document.getElementById("payslip-month");

    const employeeSelect = document.getElementById("payslip-employee");

    const employeeSelectorField =
        document.getElementById("employee-selector-field");

    const payslipContent =
        document.getElementById("payslip-content");

    const payslipEmpty =
        document.getElementById("payslip-empty");

    const emptyMessage =
        document.getElementById("payslip-empty-message");

    const payslipActions =
        document.getElementById("payslip-actions");

    const message = document.getElementById("payslip-message");

    const logoutButton = document.getElementById("logout-btn");

    const sidebarUserName = document.getElementById("sidebar-user-name");
    const sidebarRole = document.getElementById("sidebar-role");

    const topUserName = document.getElementById("top-user-name");
    const userAvatar = document.getElementById("user-avatar");


    // Read saved data
    function getPayslipUsers() {

        const users = getData("hcm_users", []);

        return Array.isArray(users) ? users : [];
    }


    function getCompanySettings() {

        return getData("hcm_company", {});
    }


    function getAttendanceRecords() {

        const records = getData("hcm_attendance", []);

        return Array.isArray(records) ? records : [];
    }


    // Use the freshest version of the logged-in account
    function getCurrentPayslipUser() {

        return getPayslipUsers().find(function (user) {

            return Number(user.id) ===
                Number(payslipSessionUser.id);

        }) || null;
    }


    // Date helpers
    function getLocalDate(date = new Date()) {

        const year = date.getFullYear();

        const month = String(date.getMonth() + 1).padStart(2, "0");

        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }


    function getCurrentMonth() {

        return getLocalDate().slice(0, 7);
    }


    function formatMoney(amount) {

        return "Rs. " + Number(amount).toLocaleString("en-PK", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }


    function showMessage(text, type = "error") {

        message.textContent = text;

        message.className = text
            ? "form-message " + type
            : "form-message";
    }


    function showEmptyState(text) {

        payslipContent.hidden = true;

        payslipActions.hidden = true;

        payslipEmpty.hidden = false;

        emptyMessage.textContent = text;
    }


    // Working weekdays come from Admin's company settings
    function getWorkingDaysOfWeek() {

        const settings = getCompanySettings();

        if (
            Array.isArray(settings.workingDays) &&
            settings.workingDays.length > 0
        ) {
            return settings.workingDays.map(Number);
        }

        return [1, 2, 3, 4, 5];
    }


    // Build all configured working dates in a selected month
    function getWorkingDates(year, monthIndex) {

        const workingDays = getWorkingDaysOfWeek();

        const dates = [];

        const date = new Date(year, monthIndex, 1);

        while (date.getMonth() === monthIndex) {

            if (workingDays.includes(date.getDay())) {
                dates.push(getLocalDate(date));
            }

            date.setDate(date.getDate() + 1);
        }

        return dates;
    }


    // Show user information in the header
    function renderUserHeader(user) {

        sidebarUserName.textContent = user.name || "User";

        topUserName.textContent = user.name || "User";

        userAvatar.textContent =
            (user.name || "U").charAt(0).toUpperCase();

        sidebarRole.textContent =
            user.role === "admin"
                ? "Administrator"
                : "Employee";
    }


    // Only display navigation links allowed by the user's role
    function configureNavigation(user) {

        document.querySelectorAll(".admin-nav-link").forEach(
            function (link) {

                link.hidden = user.role !== "admin";
            }
        );

        document.querySelectorAll(".employee-nav-link").forEach(
            function (link) {

                link.hidden = user.role !== "employee";
            }
        );
    }


    // Populate employee selector for Admin
    function populateEmployeeSelector() {

        const employees = getPayslipUsers().filter(function (user) {
            return user.role === "employee";
        });

        const previousValue = employeeSelect.value;

        employeeSelect.replaceChildren();

        employees.forEach(function (employee) {

            const option = document.createElement("option");

            option.value = String(employee.id);

            option.textContent =
                employee.name + " (" + employee.email + ")";

            employeeSelect.appendChild(option);
        });

        if (
            employees.some(function (employee) {
                return String(employee.id) === previousValue;
            })
        ) {
            employeeSelect.value = previousValue;
        }

        return employees;
    }


    // Display the payslip for one employee and one month
    function renderPayslip() {

        showMessage("");

        const loggedInUser = getCurrentPayslipUser();

        if (!loggedInUser) {

            showEmptyState(
                "Your account is no longer available. Please contact the Admin."
            );

            return;
        }


        // Employees can view only their own payslip.
        // Admins can select any employee account.

        let selectedEmployee;

        if (loggedInUser.role === "admin") {

            const employees = populateEmployeeSelector();

            if (employees.length === 0) {

                showEmptyState(
                    "No employees found. Add an employee before generating a payslip."
                );

                return;
            }

            selectedEmployee = employees.find(function (employee) {

                return String(employee.id) === employeeSelect.value;
            });

        } else {

            selectedEmployee = loggedInUser;
        }


        if (!selectedEmployee) {

            showEmptyState("Please select an employee.");

            return;
        }


        // Validate selected month
        const selectedMonth = monthInput.value;

        if (!/^\d{4}-\d{2}$/.test(selectedMonth)) {

            showEmptyState("Please select a valid salary month.");

            return;
        }

        const [yearText, monthText] = selectedMonth.split("-");

        const year = Number(yearText);

        const monthNumber = Number(monthText);

        if (monthNumber < 1 || monthNumber > 12) {

            showEmptyState("Please select a valid salary month.");

            return;
        }

        const monthIndex = monthNumber - 1;


        // Load company and salary data
        const company = getCompanySettings();

        const companyName = company.name || "HCM Lite";

        const monthlySalary = Number(selectedEmployee.salary);

        if (
            !Number.isFinite(monthlySalary) ||
            monthlySalary < 0
        ) {

            showEmptyState(
                "This employee does not have a valid monthly salary."
            );

            return;
        }


        // All configured working dates determine the per-day rate.
        const workingDates = getWorkingDates(year, monthIndex);

        const totalWorkingDays = workingDates.length;

        const dailySalary = totalWorkingDays > 0
            ? monthlySalary / totalWorkingDays
            : 0;


        // Fetch only this employee's attendance in this month.
        const attendance = getAttendanceRecords().filter(
            function (record) {

                return (
                    Number(record.employeeId) ===
                        Number(selectedEmployee.id) &&
                    String(record.date || "").startsWith(selectedMonth)
                );
            }
        );


        // Map each recorded date to its attendance record.
        const attendanceByDate = new Map();

        attendance.forEach(function (record) {

            attendanceByDate.set(record.date, record);
        });


        // Count completed working days with no attendance as absent.
        // Do not count today's date or future dates as absent yet.

        const today = getLocalDate();

        let absentDays = 0;

        let halfDays = 0;

        workingDates.forEach(function (dateString) {

            if (dateString >= today) {
                return;
            }

            const record = attendanceByDate.get(dateString);

            if (!record) {

                absentDays++;

                return;
            }

            if (
                String(record.status || "").toLowerCase() ===
                "half day"
            ) {
                halfDays++;
            }

        });


        // PDF formula:
        // Deduction = per-day salary * (absent days + 0.5 * half days)

        const deduction =
            dailySalary * (absentDays + (0.5 * halfDays));

        const netSalary = monthlySalary - deduction;


        // Month label
        const monthLabel = new Date(
            year,
            monthIndex,
            1
        ).toLocaleDateString("en-PK", {
            month: "long",
            year: "numeric"
        });


        // Fill in employee and company details
        document.getElementById("slip-company-name").textContent =
            companyName;

        document.getElementById("slip-period").textContent =
            monthLabel;

        document.getElementById("slip-employee-id").textContent =
            String(selectedEmployee.id);

        document.getElementById("slip-employee-name").textContent =
            selectedEmployee.name || "—";

        document.getElementById("slip-employee-email").textContent =
            selectedEmployee.email || "—";

        document.getElementById("slip-department").textContent =
            selectedEmployee.department || "—";

        document.getElementById("slip-role").textContent =
            selectedEmployee.role === "admin"
                ? "Administrator"
                : "Employee";


        // Fill in salary calculation
        document.getElementById("slip-monthly-salary").textContent =
            formatMoney(monthlySalary);

        document.getElementById("slip-working-days").textContent =
            String(totalWorkingDays);

        document.getElementById("slip-daily-rate").textContent =
            formatMoney(dailySalary);

        document.getElementById("slip-absent-days").textContent =
            String(absentDays);

        document.getElementById("slip-half-days").textContent =
            String(halfDays);

        document.getElementById("slip-deduction").textContent =
            formatMoney(deduction);

        document.getElementById("slip-net-salary").textContent =
            formatMoney(netSalary);


        // Display the completed payslip
        payslipEmpty.hidden = true;

        payslipContent.hidden = false;

        payslipActions.hidden = false;
    }


    // Initialize month selector
    monthInput.value = getCurrentMonth();


    // Display user and configure navigation
    renderUserHeader(payslipSessionUser);

    configureNavigation(payslipSessionUser);


    // Show employee selector only for Admin
    if (payslipSessionUser.role === "admin") {

        employeeSelectorField.hidden = false;
    }


    // Refresh when Admin selects a different employee
    employeeSelect.addEventListener("change", renderPayslip);


    // Refresh when the month changes
    monthInput.addEventListener("change", renderPayslip);


    // Logout
    logoutButton.addEventListener("click", function (event) {

        event.preventDefault();

        logoutUser();
    });


    // When saved data changes in another tab, refresh the payslip.
    window.addEventListener("storage", function (event) {

        if (
            event.key === "hcm_users" ||
            event.key === "hcm_company" ||
            event.key === "hcm_attendance"
        ) {
            renderPayslip();
        }
    });


    // Initial render
    renderPayslip();

}
