
/* HCM Lite - Admin Leave Management */

const currentAdmin = requireAuth("admin");

if (currentAdmin) {

    const tableBody = document.getElementById("leaves-table-body");
    const searchInput = document.getElementById("leave-search");
    const statusFilter = document.getElementById("status-filter");
    const message = document.getElementById("leaves-message");
    const logoutButton = document.getElementById("logout-btn");

    const adminName = document.getElementById("admin-name");
    const topAdminName = document.getElementById("top-admin-name");
    const adminAvatar = document.getElementById("admin-avatar");

    const totalRequests = document.getElementById("total-requests");
    const pendingRequests = document.getElementById("pending-requests");
    const approvedRequests = document.getElementById("approved-requests");
    const rejectedRequests = document.getElementById("rejected-requests");

    adminName.textContent = currentAdmin.name;
    topAdminName.textContent = currentAdmin.name;
    adminAvatar.textContent = currentAdmin.name.charAt(0).toUpperCase();


    // Read all leave requests
    function getLeaves() {
        return getData(STORAGE_KEYS.leaves, []);
    }


    // Read users to find the employee who applied
    function getUsersForLeaves() {
        return getUsers();
    }


    // Show feedback to Admin
    function showMessage(text, type = "error") {
        message.textContent = text;
        message.className = "form-message " + type;
    }


    // Date formatting
    function formatDate(dateString) {

        if (!dateString) {
            return "—";
        }

        const date = new Date(dateString + "T00:00:00");

        return date.toLocaleDateString("en-PK", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }


    // Update request counts
    function renderCounts(leaves) {

        totalRequests.textContent = leaves.length;

        pendingRequests.textContent = leaves.filter(function (leave) {
            return leave.status === "pending";
        }).length;

        approvedRequests.textContent = leaves.filter(function (leave) {
            return leave.status === "approved";
        }).length;

        rejectedRequests.textContent = leaves.filter(function (leave) {
            return leave.status === "rejected";
        }).length;
    }


    // Render the leave request table
    function renderLeaves() {

        const leaves = getLeaves();
        const users = getUsersForLeaves();

        const searchText = searchInput.value.trim().toLowerCase();
        const selectedStatus = statusFilter.value;

        renderCounts(leaves);

        const filteredLeaves = leaves.filter(function (leave) {

            const employee = users.find(function (user) {
                return Number(user.id) === Number(leave.employeeId);
            });

            const employeeName = employee ? employee.name : "Deleted employee";
            const employeeEmail = employee ? employee.email : "";

            const searchableText = [
                employeeName,
                employeeEmail,
                leave.type,
                leave.reason,
                leave.status,
                leave.from,
                leave.to
            ].join(" ").toLowerCase();

            const matchesSearch = searchableText.includes(searchText);

            const matchesStatus =
                selectedStatus === "" || leave.status === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        tableBody.replaceChildren();

        if (filteredLeaves.length === 0) {

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 8;
            cell.textContent = leaves.length === 0
                ? "No leave requests have been submitted yet."
                : "No leave requests match your search.";

            row.appendChild(cell);
            tableBody.appendChild(row);

            return;
        }

        filteredLeaves.forEach(function (leave) {

            const employee = users.find(function (user) {
                return Number(user.id) === Number(leave.employeeId);
            });

            const row = document.createElement("tr");

            // Employee
            const employeeCell = document.createElement("td");
            const employeeStrong = document.createElement("strong");

            employeeStrong.textContent = employee
                ? employee.name
                : "Deleted employee";

            employeeCell.appendChild(employeeStrong);

            if (employee) {
                const email = document.createElement("small");

                email.textContent = employee.email;
                email.style.display = "block";

                employeeCell.appendChild(email);
            }

            // Leave type
            const typeCell = document.createElement("td");
            typeCell.textContent = leave.type || "—";

            // Dates
            const datesCell = document.createElement("td");
            datesCell.textContent =
                formatDate(leave.from) + " – " + formatDate(leave.to);

            // Working days
            const daysCell = document.createElement("td");
            daysCell.textContent = String(leave.days ?? 0);

            // Reason
            const reasonCell = document.createElement("td");
            reasonCell.textContent = leave.reason || "—";

            // Status
            const statusCell = document.createElement("td");
            const statusBadge = document.createElement("span");

            statusBadge.className = "pill";
            statusBadge.textContent = leave.status || "pending";

            statusCell.appendChild(statusBadge);

            // Existing Admin comment
            const commentCell = document.createElement("td");
            commentCell.textContent = leave.comment || "—";

            // Actions
            const actionsCell = document.createElement("td");

            if (leave.status === "pending") {

                const commentInput = document.createElement("textarea");

                commentInput.rows = 2;
                commentInput.className = "leave-comment-input";
                commentInput.placeholder = "Admin comment (required)";
                commentInput.setAttribute(
                    "aria-label",
                    "Comment for " + (employee ? employee.name : "employee")
                );

                // Preserve a comment if the table is re-rendered
                commentInput.value = leave.comment || "";

                const approveButton = document.createElement("button");

                approveButton.type = "button";
                approveButton.className = "btn small";
                approveButton.textContent = "Approve";
                approveButton.dataset.action = "approve";
                approveButton.dataset.id = leave.id;

                const rejectButton = document.createElement("button");

                rejectButton.type = "button";
                rejectButton.className = "btn danger small";
                rejectButton.textContent = "Reject";
                rejectButton.dataset.action = "reject";
                rejectButton.dataset.id = leave.id;

                const buttons = document.createElement("div");
                buttons.className = "actions";

                buttons.append(approveButton, rejectButton);

                actionsCell.append(commentInput, buttons);

            } else {

                actionsCell.textContent = "Reviewed";

            }

            row.append(
                employeeCell,
                typeCell,
                datesCell,
                daysCell,
                reasonCell,
                statusCell,
                commentCell,
                actionsCell
            );

            tableBody.appendChild(row);

        });
    }


    // Approve or reject a request
    tableBody.addEventListener("click", function (event) {

        const button = event.target.closest("button[data-action]");

        if (!button) {
            return;
        }

        const leaveId = Number(button.dataset.id);
        const action = button.dataset.action;

        if (action !== "approve" && action !== "reject") {
            return;
        }

        const leaves = getLeaves();

        const leave = leaves.find(function (item) {
            return Number(item.id) === leaveId;
        });

        if (!leave) {
            showMessage("Leave request not found.");
            return;
        }

        if (leave.status !== "pending") {
            showMessage("This request has already been reviewed.");
            renderLeaves();
            return;
        }

        const row = button.closest("tr");
        const commentInput = row.querySelector(".leave-comment-input");
        const comment = commentInput.value.trim();

        if (!comment) {
            showMessage("Please enter an Admin comment before reviewing.");
            commentInput.focus();
            return;
        }

        leave.status = action === "approve" ? "approved" : "rejected";
        leave.comment = comment;

        saveData(STORAGE_KEYS.leaves, leaves);

        showMessage(
            action === "approve"
                ? "Leave request approved."
                : "Leave request rejected.",
            "success"
        );

        renderLeaves();
    });


    // Search
    searchInput.addEventListener("input", renderLeaves);

    // Filter by status
    statusFilter.addEventListener("change", renderLeaves);

    // Logout
    logoutButton.addEventListener("click", function (event) {
        event.preventDefault();
        logoutUser();
    });

    // Initial render
    renderLeaves();

}
