
/* HCM Lite - Employee Dashboard
   Attendance and leave requests are stored in localStorage.
*/

const hcmEmployee = requireAuth("employee");

if (hcmEmployee) {

    // ---------- HTML Elements ----------

    const employeeNameEl = document.getElementById("employee-name");
    const topEmployeeNameEl = document.getElementById("top-employee-name");
    const employeeAvatarEl = document.getElementById("employee-avatar");
    const logoutButtonEl = document.getElementById("logout-btn");

    const pageMessageEl = document.getElementById("employee-message");

    // Use a separate leave message if one exists.
    // Otherwise, use the existing employee-message element.
    const leaveMessageEl =
        document.getElementById("leave-message") || pageMessageEl;

    const checkInButtonEl = document.getElementById("check-in-btn");
    const checkOutButtonEl = document.getElementById("check-out-btn");

    const todayDateEl = document.getElementById("today-date");
    const todayStatusEl = document.getElementById("today-status");
    const todayCheckInEl = document.getElementById("today-check-in");
    const todayCheckOutEl = document.getElementById("today-check-out");
    const todayWorkHoursEl = document.getElementById("today-work-hours");

    const attendanceTableEl =
        document.getElementById("attendance-table-body");

    const attendanceSearchEl =
        document.getElementById("history-search");

    const leaveFormEl = document.getElementById("leave-form");
    const leaveTypeEl = document.getElementById("leave-type");
    const leaveFromEl = document.getElementById("leave-from");
    const leaveToEl = document.getElementById("leave-to");
    const leaveReasonEl = document.getElementById("leave-reason");
    const leaveTableEl = document.getElementById("leave-table-body");

    const presentDaysEl = document.getElementById("present-days");
    const leavesTakenEl = document.getElementById("leaves-taken");
    const lateDaysEl = document.getElementById("late-days");
    const leaveBalanceEl = document.getElementById("leave-balance");


    // ---------- Company Settings ----------

    const companySettings = getData("hcm_company", {});

    const officeStartTime = companySettings.startTime || "09:00";

    const graceMinutes = Math.max(
        0,
        Number(companySettings.graceMinutes ?? 15)
    );

    const leaveQuota = Math.max(
        0,
        Number(companySettings.leaveQuota ?? 20)
    );

    const configuredWorkingDays =
        Array.isArray(companySettings.workingDays)
            ? companySettings.workingDays.map(Number)
            : [1, 2, 3, 4, 5];


    // ---------- Display Employee Information ----------

    employeeNameEl.textContent = hcmEmployee.name || "Employee";

    topEmployeeNameEl.textContent = hcmEmployee.name || "Employee";

    employeeAvatarEl.textContent =
        (hcmEmployee.name || "E").charAt(0).toUpperCase();


    // ---------- Helper Functions ----------

    function localDateString(date = new Date()) {

        const year = date.getFullYear();

        const month = String(date.getMonth() + 1).padStart(2, "0");

        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }


    function displayDate(dateString) {

        if (!dateString) {
            return "—";
        }

        const date = new Date(`${dateString}T00:00:00`);

        if (Number.isNaN(date.getTime())) {
            return dateString;
        }

        return date.toLocaleDateString("en-PK", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }


    function timeToMinutes(timeString) {

        if (!timeString || !/^\d{2}:\d{2}$/.test(timeString)) {
            return null;
        }

        const [hours, minutes] = timeString.split(":").map(Number);

        return hours * 60 + minutes;
    }


    function displayTime(timeString) {

        if (!timeString) {
            return "—";
        }

        const [hours, minutes] = timeString.split(":").map(Number);

        const date = new Date();

        date.setHours(hours, minutes, 0, 0);

        return date.toLocaleTimeString("en-PK", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    }


    function displayWorkMinutes(minutes) {

        if (
            minutes === null ||
            minutes === undefined ||
            !Number.isFinite(Number(minutes))
        ) {
            return "—";
        }

        const total = Math.max(0, Number(minutes));

        return `${Math.floor(total / 60)}h ${total % 60}m`;
    }


    function pageMessage(text, type = "error") {

        pageMessageEl.textContent = text;

        pageMessageEl.className = text
            ? `form-message ${type}`
            : "form-message";
    }


    function leaveMessage(text, type = "error") {

        leaveMessageEl.textContent = text;

        leaveMessageEl.className = text
            ? `form-message ${type}`
            : "form-message";
    }


    function getMyAttendance() {

        const records = getData("hcm_attendance", []);

        if (!Array.isArray(records)) {
            return [];
        }

        return records.filter(function (record) {

            return Number(record.employeeId) ===
                Number(hcmEmployee.id);

        });
    }


    function getMyLeaves() {

        const records = getData("hcm_leaves", []);

        if (!Array.isArray(records)) {
            return [];
        }

        return records.filter(function (leave) {

            return Number(leave.employeeId) ===
                Number(hcmEmployee.id);

        });
    }


    function getTodayAttendance() {

        const today = localDateString();

        return getMyAttendance().find(function (record) {

            return record.date === today;

        }) || null;
    }


    // Count weekdays, excluding Saturday and Sunday.
    // Optional yearFilter counts only weekdays in a particular year.

    function countWorkingDays(from, to, yearFilter = null) {

        if (!from || !to || from > to) {
            return 0;
        }

        const start = new Date(`${from}T00:00:00`);
        const end = new Date(`${to}T00:00:00`);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime())
        ) {
            return 0;
        }

        let days = 0;

        const date = new Date(start);

        while (date <= end) {

            const weekday = date.getDay();

            const correctYear =
                yearFilter === null ||
                date.getFullYear() === yearFilter;

            if (
                weekday !== 0 &&
                weekday !== 6 &&
                correctYear
            ) {
                days++;
            }

            date.setDate(date.getDate() + 1);
        }

        return days;
    }


    function normalizedStatus(leave) {

        return String(leave.status || "pending").toLowerCase();
    }


    // ---------- Today's Attendance ----------

    function renderTodayAttendance() {

        const now = new Date();

        const today = localDateString(now);

        const record = getTodayAttendance();

        const isWorkingDay =
            configuredWorkingDays.includes(now.getDay());

        todayDateEl.textContent = displayDate(today);

        if (record) {

            todayStatusEl.textContent =
                record.status || "present";

            todayCheckInEl.textContent =
                displayTime(record.checkIn);

            todayCheckOutEl.textContent =
                displayTime(record.checkOut);

            todayWorkHoursEl.textContent = record.checkOut
                ? displayWorkMinutes(record.workMinutes)
                : "In progress";

        } else {

            todayStatusEl.textContent = isWorkingDay
                ? "Not checked in"
                : "Non-working day";

            todayCheckInEl.textContent = "—";
            todayCheckOutEl.textContent = "—";
            todayWorkHoursEl.textContent = "—";
        }

        // Prevent duplicate check-ins and check-outs.
        checkInButtonEl.disabled =
            !isWorkingDay || Boolean(record);

        checkOutButtonEl.disabled =
            !isWorkingDay ||
            !record ||
            !record.checkIn ||
            Boolean(record.checkOut);
    }


    // ---------- Check In ----------

    checkInButtonEl.addEventListener("click", function () {

        pageMessage("");

        const now = new Date();

        const today = localDateString(now);

        if (!configuredWorkingDays.includes(now.getDay())) {

            pageMessage(
                "Today is a non-working day. Check-in is disabled by company settings."
            );

            return;
        }

        const allRecords = getData("hcm_attendance", []);

        if (!Array.isArray(allRecords)) {

            pageMessage(
                "Attendance data could not be read. Refresh and try again."
            );

            return;
        }

        const alreadyExists = allRecords.some(function (record) {

            return (
                Number(record.employeeId) ===
                    Number(hcmEmployee.id) &&
                record.date === today
            );

        });

        if (alreadyExists) {

            pageMessage("You have already checked in today.");

            renderAll();

            return;
        }

        const checkIn =
            String(now.getHours()).padStart(2, "0") +
            ":" +
            String(now.getMinutes()).padStart(2, "0");

        const checkInMinutes = timeToMinutes(checkIn);

        const officeMinutes = timeToMinutes(officeStartTime);

        const isLate =
            officeMinutes !== null &&
            checkInMinutes > officeMinutes + graceMinutes;

        allRecords.push({

            id: Date.now(),

            employeeId: hcmEmployee.id,

            date: today,

            checkIn: checkIn,

            checkOut: "",

            status: isLate ? "late" : "present",

            isLate: isLate,

            workMinutes: null

        });

        try {

            saveData("hcm_attendance", allRecords);

        } catch (error) {

            console.error("Could not save check-in:", error);

            pageMessage(
                "Could not save check-in. Check browser storage and try again."
            );

            return;
        }

        renderAll();

        pageMessage("Check-in saved successfully.", "success");
    });


    // ---------- Check Out ----------

    checkOutButtonEl.addEventListener("click", function () {

        pageMessage("");

        const today = localDateString();

        const allRecords = getData("hcm_attendance", []);

        if (!Array.isArray(allRecords)) {

            pageMessage(
                "Attendance data could not be read. Refresh and try again."
            );

            return;
        }

        const record = allRecords.find(function (item) {

            return (
                Number(item.employeeId) ===
                    Number(hcmEmployee.id) &&
                item.date === today
            );

        });

        if (!record || !record.checkIn) {

            pageMessage("Please check in before checking out.");

            return;
        }

        if (record.checkOut) {

            pageMessage("You have already checked out today.");

            return;
        }

        const now = new Date();

        const checkOut =
            String(now.getHours()).padStart(2, "0") +
            ":" +
            String(now.getMinutes()).padStart(2, "0");

        const startMinutes = timeToMinutes(record.checkIn);

        const endMinutes = timeToMinutes(checkOut);

        if (
            startMinutes === null ||
            endMinutes === null ||
            endMinutes <= startMinutes
        ) {

            pageMessage(
                "Check-out must be after check-in. If both times are in the same minute, try again in the next minute."
            );

            return;
        }

        record.checkOut = checkOut;

        record.workMinutes = endMinutes - startMinutes;

        // Less than five hours means half day.

        if (record.workMinutes < 300) {

            record.status = "half day";

        } else {

            record.status = record.isLate ? "late" : "present";
        }

        try {

            saveData("hcm_attendance", allRecords);

        } catch (error) {

            console.error("Could not save check-out:", error);

            pageMessage("Could not save check-out. Try again.");

            return;
        }

        renderAll();

        pageMessage("Check-out saved successfully.", "success");
    });


    // ---------- Attendance History ----------

    function renderAttendanceHistory() {

        const query =
            attendanceSearchEl.value.trim().toLowerCase();

        const records = getMyAttendance().sort(function (a, b) {

            return b.date.localeCompare(a.date);

        });

        const filtered = records.filter(function (record) {

            const searchableText = [
                record.date,
                record.status,
                record.checkIn,
                record.checkOut
            ].join(" ").toLowerCase();

            return searchableText.includes(query);

        });

        attendanceTableEl.replaceChildren();

        if (filtered.length === 0) {

            const row = document.createElement("tr");

            const cell = document.createElement("td");

            cell.colSpan = 5;

            cell.textContent = records.length === 0
                ? "No attendance records yet. Check in on a configured working day."
                : "No attendance records match your search.";

            row.appendChild(cell);

            attendanceTableEl.appendChild(row);

            return;
        }

        filtered.forEach(function (record) {

            const row = document.createElement("tr");

            const values = [
                displayDate(record.date),
                displayTime(record.checkIn),
                displayTime(record.checkOut),
                record.checkOut
                    ? displayWorkMinutes(record.workMinutes)
                    : "In progress",
                record.status || "present"
            ];

            values.forEach(function (value, index) {

                const cell = document.createElement("td");

                cell.textContent = value;

                if (index === 4) {

                    const badge = document.createElement("span");

                    badge.className = "pill";

                    badge.textContent = value;

                    cell.replaceChildren(badge);
                }

                row.appendChild(cell);
            });

            attendanceTableEl.appendChild(row);
        });
    }


    // ---------- Leave Statistics ----------

    function getApprovedLeaveDays(year) {

        return getMyLeaves().reduce(function (total, leave) {

            if (normalizedStatus(leave) !== "approved") {
                return total;
            }

            return total + countWorkingDays(
                leave.from,
                leave.to,
                year
            );

        }, 0);
    }


    function renderStatistics() {

        const now = new Date();

        const monthKey = localDateString(now).slice(0, 7);

        const year = now.getFullYear();

        const monthlyRecords = getMyAttendance().filter(function (record) {

            return String(record.date || "").slice(0, 7) === monthKey;

        });

        const presentValue = monthlyRecords.reduce(function (sum, record) {

            return sum +
                (String(record.status).toLowerCase() === "half day"
                    ? 0.5
                    : 1);

        }, 0);

        const lateValue = monthlyRecords.filter(function (record) {

            return (
                record.isLate === true ||
                String(record.status).toLowerCase() === "late"
            );

        }).length;

        const leaveValue = getApprovedLeaveDays(year);

        presentDaysEl.textContent = String(presentValue);

        lateDaysEl.textContent = String(lateValue);

        leavesTakenEl.textContent = String(leaveValue);

        leaveBalanceEl.textContent =
            String(Math.max(0, leaveQuota - leaveValue));
    }


    // ---------- Leave Request History ----------

    function renderLeaveHistory() {

        const leaves = getMyLeaves().sort(function (a, b) {

            return String(b.from).localeCompare(String(a.from));

        });

        leaveTableEl.replaceChildren();

        if (leaves.length === 0) {

            const row = document.createElement("tr");

            const cell = document.createElement("td");

            cell.colSpan = 6;

            cell.textContent = "No leave requests yet.";

            row.appendChild(cell);

            leaveTableEl.appendChild(row);

            return;
        }

        leaves.forEach(function (leave) {

            const row = document.createElement("tr");

            const values = [
                leave.type || "—",
                displayDate(leave.from),
                displayDate(leave.to),
                String(
                    leave.days ??
                    countWorkingDays(leave.from, leave.to)
                ),
                normalizedStatus(leave),
                leave.comment || "—"
            ];

            values.forEach(function (value, index) {

                const cell = document.createElement("td");

                cell.textContent = value;

                if (index === 4) {

                    const badge = document.createElement("span");

                    badge.className = "pill";

                    badge.textContent = value;

                    cell.replaceChildren(badge);
                }

                row.appendChild(cell);
            });

            leaveTableEl.appendChild(row);
        });
    }


    // ---------- Submit Leave Application ----------

    leaveFormEl.addEventListener("submit", function (event) {

        event.preventDefault();

        leaveMessage("");

        const type = leaveTypeEl.value;

        const from = leaveFromEl.value;

        const to = leaveToEl.value;

        const reason = leaveReasonEl.value.trim();


        // Check required fields.

        if (!from || !to || !reason) {

            leaveMessage(
                "Please fill in leave type, both dates and reason."
            );

            return;
        }


        // From date cannot be after To date.

        if (from > to) {

            leaveMessage(
                "The From date must be on or before the To date."
            );

            return;
        }


        // Count working days, excluding Saturday and Sunday.

        const requestedDays = countWorkingDays(from, to);

        if (requestedDays <= 0) {

            leaveMessage(
                "The selected date range has no working days. Weekends are excluded."
            );

            return;
        }


        const myLeaves = getMyLeaves();


        // Prevent overlapping pending or approved leave requests.

        const overlaps = myLeaves.some(function (leave) {

            const status = normalizedStatus(leave);

            const active =
                status === "pending" ||
                status === "approved";

            return active &&
                from <= leave.to &&
                to >= leave.from;

        });

        if (overlaps) {

            leaveMessage(
                "These dates overlap an existing pending or approved request. Check My Leave Requests below."
            );

            return;
        }


        // Count requested weekdays by calendar year.

        const requestedByYear = {};

        const cursor = new Date(`${from}T00:00:00`);

        const endDate = new Date(`${to}T00:00:00`);

        while (cursor <= endDate) {

            const weekday = cursor.getDay();

            if (weekday !== 0 && weekday !== 6) {

                const year = cursor.getFullYear();

                requestedByYear[year] =
                    (requestedByYear[year] || 0) + 1;
            }

            cursor.setDate(cursor.getDate() + 1);
        }


        // Check remaining yearly leave quota.

        for (
            const [yearText, requestedForYear]
            of Object.entries(requestedByYear)
        ) {

            const year = Number(yearText);

            const reservedForYear = myLeaves.reduce(
                function (sum, leave) {

                    const status = normalizedStatus(leave);

                    if (
                        status !== "pending" &&
                        status !== "approved"
                    ) {
                        return sum;
                    }

                    return sum + countWorkingDays(
                        leave.from,
                        leave.to,
                        year
                    );

                },
                0
            );

            if (reservedForYear + requestedForYear > leaveQuota) {

                const remaining = Math.max(
                    0,
                    leaveQuota - reservedForYear
                );

                leaveMessage(
                    `Leave quota for ${year} would be exceeded. ` +
                    `Remaining available quota: ${remaining} day(s).`
                );

                return;
            }
        }


        // Read all employees' leave requests.

        const allLeaves = getData("hcm_leaves", []);

        if (!Array.isArray(allLeaves)) {

            leaveMessage(
                "Saved leave data could not be read. Refresh the page and try again."
            );

            return;
        }


        // Create a unique request ID.

        let newId = Date.now();

        while (allLeaves.some(function (leave) {

            return Number(leave.id) === newId;

        })) {

            newId++;
        }


        // Create the new request.

        const newLeave = {

            id: newId,

            employeeId: hcmEmployee.id,

            type: type,

            from: from,

            to: to,

            days: requestedDays,

            reason: reason,

            status: "pending",

            comment: ""

        };


        allLeaves.push(newLeave);


        // Save the request.

        try {

            saveData("hcm_leaves", allLeaves);

        } catch (error) {

            console.error(
                "Could not save leave request:",
                error
            );

            leaveMessage(
                "The leave request could not be saved in this browser. Check storage settings and try again."
            );

            return;
        }


        // Clear the form and refresh the tables.

        leaveFormEl.reset();

        renderAll();

        leaveMessage(
            "Leave request submitted successfully. It is waiting for Admin approval.",
            "success"
        );

    });


    // ---------- Logout ----------

    logoutButtonEl.addEventListener("click", function (event) {

        event.preventDefault();

        logoutUser();

    });


    // ---------- Attendance Search ----------

    attendanceSearchEl.addEventListener(
        "input",
        renderAttendanceHistory
    );


    // ---------- Refresh All Dashboard Sections ----------

    function renderAll() {

        renderTodayAttendance();

        renderAttendanceHistory();

        renderLeaveHistory();

        renderStatistics();
    }


    // Initial page load.

    renderAll();

}
