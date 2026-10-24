
/* HCM Lite - Dynamic Admin Dashboard */

const dashboardAdmin = requireAuth("admin");

if (dashboardAdmin) {

    // Dashboard statistics
    const totalEmployeesEl = document.getElementById("total-employees");
    const presentTodayEl = document.getElementById("present-today");
    const onLeaveTodayEl = document.getElementById("on-leave-today");
    const lateTodayEl = document.getElementById("late-today");

    const summaryPresentEl = document.getElementById("summary-present");
    const summaryLateEl = document.getElementById("summary-late");
    const summaryLeaveEl = document.getElementById("summary-leave");

    const logoutButton = document.getElementById("logout-btn");

    // Smart Helper elements
    const helperQuestion = document.getElementById("helper-question");
    const helperSend = document.getElementById("helper-send");
    const helperAnswer = document.getElementById("helper-answer");

    // Current date in YYYY-MM-DD format
    function getToday() {

        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    // Read saved data
    function getEmployees() {

        return getData("hcm_users", []).filter(function (user) {
            return user.role === "employee";
        });
    }

    function getTodayAttendance() {

        const today = getToday();

        return getData("hcm_attendance", []).filter(function (record) {
            return record.date === today;
        });
    }

    function getTodayApprovedLeaves() {

        const today = getToday();

        return getData("hcm_leaves", []).filter(function (leave) {

            return leave.status === "approved" &&
                leave.from <= today &&
                leave.to >= today;
        });
    }

    // Calculate today's statistics
    function getDashboardStats() {

        const employees = getEmployees();
        const attendance = getTodayAttendance();
        const approvedLeaves = getTodayApprovedLeaves();

        const presentEmployees = new Set();

        const lateEmployees = new Set();

        attendance.forEach(function (record) {

            const status = String(record.status || "").toLowerCase();

            if (
                status === "present" ||
                status === "late" ||
                status === "half day"
            ) {
                presentEmployees.add(Number(record.employeeId));
            }

            if (record.isLate === true || status === "late") {
                lateEmployees.add(Number(record.employeeId));
            }
        });

        // Count each employee only once
        const employeesOnLeave = new Set(
            approvedLeaves.map(function (leave) {
                return Number(leave.employeeId);
            })
        );

        return {
            totalEmployees: employees.length,
            present: presentEmployees.size,
            onLeave: employeesOnLeave.size,
            late: lateEmployees.size
        };
    }

    // Display statistics
    function renderDashboard() {

        const stats = getDashboardStats();

        totalEmployeesEl.textContent = stats.totalEmployees;
        presentTodayEl.textContent = stats.present;
        onLeaveTodayEl.textContent = stats.onLeave;
        lateTodayEl.textContent = stats.late;

        summaryPresentEl.textContent = stats.present;
        summaryLateEl.textContent = stats.late;
        summaryLeaveEl.textContent = stats.onLeave;
    }

    // Smart Helper answers using real app data
    function answerHelper() {

        const question = helperQuestion.value.trim().toLowerCase();

        if (!question) {

            helperAnswer.textContent = "Please enter a question.";

            return;
        }

        const stats = getDashboardStats();

        const employees = getEmployees();
        const attendance = getTodayAttendance();
        const today = getToday();

        const approvedLeaves = getTodayApprovedLeaves();

        if (
            question.includes("leave") &&
            (question.includes("who") || question.includes("which"))
        ) {

            const users = employees.filter(function (employee) {

                return approvedLeaves.some(function (leave) {
                    return Number(leave.employeeId) === Number(employee.id);
                });
            });

            helperAnswer.textContent = users.length
                ? "Employees on approved leave today: " +
                  users.map(function (user) {
                      return user.name;
                  }).join(", ")
                : "No employees are on approved leave today.";

        } else if (question.includes("late")) {

            const lateRecords = attendance.filter(function (record) {

                return record.isLate === true ||
                    String(record.status).toLowerCase() === "late";
            });

            const lateEmployees = lateRecords.map(function (record) {

                const employee = employees.find(function (user) {
                    return Number(user.id) === Number(record.employeeId);
                });

                return employee ? employee.name : null;

            }).filter(Boolean);

            helperAnswer.textContent =
                "Employees late today: " +
                (lateEmployees.length
                    ? lateEmployees.join(", ")
                    : "None");

        } else if (
            question.includes("employee") ||
            question.includes("staff") ||
            question.includes("team")
        ) {

            helperAnswer.textContent =
                "Your company currently has " +
                stats.totalEmployees +
                " employees.";

        } else {

            helperAnswer.textContent =
                "Try asking: How many employees do we have? " +
                "Who is on leave today? or Who was late today?";
        }
    }

    // Smart Helper button
    if (helperSend && helperQuestion && helperAnswer) {

        helperSend.addEventListener("click", answerHelper);

        helperQuestion.addEventListener("keydown", function (event) {

            if (event.key === "Enter") {
                event.preventDefault();
                answerHelper();
            }
        });
    }

    // Logout
    if (logoutButton) {

        logoutButton.addEventListener("click", function (event) {

            event.preventDefault();

            logoutUser();
        });
    }

    // Initial dashboard load
    renderDashboard();

    // Refresh numbers when another tab changes saved records
    window.addEventListener("storage", function (event) {

        if (
            event.key === "hcm_users" ||
            event.key === "hcm_attendance" ||
            event.key === "hcm_leaves"
        ) {
            renderDashboard();
        }
    });
}
