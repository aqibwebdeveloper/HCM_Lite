
/* HCM Lite - Dynamic Admin Leave Management */

console.log("[HCM] Dynamic leaves.js loaded");

const currentAdmin = requireAuth("admin");

if (currentAdmin) {

    // HTML elements
    const tableBody = document.getElementById("leaves-table-body");
    const searchInput = document.getElementById("leave-search");
    const statusFilter = document.getElementById("status-filter");
    const message = document.getElementById("leaves-message");

    const adminName = document.getElementById("sidebar-admin-name");
    const topAdminName = document.getElementById("top-admin-name");
    const adminAvatar = document.getElementById("admin-avatar");
    const logoutButton = document.getElementById("logout-btn");

    const totalRequests = document.getElementById("total-requests");
    const pendingRequests = document.getElementById("pending-requests");
    const approvedRequests = document.getElementById("approved-requests");
    const rejectedRequests = document.getElementById("rejected-requests");

    // Display Admin details
    adminName.textContent = currentAdmin.name;
    topAdminName.textContent = currentAdmin.name;
    adminAvatar.textContent = currentAdmin.name.charAt(0).toUpperCase();


    // Read leave requests directly from localStorage
    function getLeaves() {

        const leaves = getData("hcm_leaves", []);

        return Array.isArray(leaves) ? leaves : [];
    }


    // Read all registered users
    function getAllUsers() {

        const users = getData("hcm_users", []);

        return Array.isArray(users) ? users : [];
    }


    // Normalize request status
    function getStatus(leave) {

        return String(leave.status || "pending").toLowerCase();
    }


    // Format dates
    function formatDate(dateString) {

        if (!dateString) {
            return "—";
        }

        const date = new Date(dateString + "T00:00:00");

        if (Number.isNaN(date.getTime())) {
            return dateString;
        }

        return date.toLocaleDateString("en-PK", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }


    // Calculate weekdays if days were not saved
    function countWorkingDays(from, to) {

        if (!from || !to || from > to) {
            return 0;
        }

        const date = new Date(from + "T00:00:00");
        const endDate = new Date(to + "T00:00:00");

        let days = 0;

        while (date <= endDate) {

            const weekday = date.getDay();

            if (weekday !== 0 && weekday !== 6) {
                days++;
            }

            date.setDate(date.getDate() + 1);
        }

        return days;
    }


    // Display feedback
    function showMessage(text, type = "error") {

        message.textContent = text;
        message.className = text
            ? "form-message " + type
            : "form-message";
    }


    // Update summary cards
    function renderCounts(leaves) {

        totalRequests.textContent = leaves.length;

        pendingRequests.textContent = leaves.filter(function (leave) {
            return getStatus(leave) === "pending";
        }).length;

        approvedRequests.textContent = leaves.filter(function (leave) {
            return getStatus(leave) === "approved";
        }).length;

        rejectedRequests.textContent = leaves.filter(function (leave) {
            return getStatus(leave) === "rejected";
        }).length;
    }


    // Render dynamic leave requests
    function renderLeaves() {

        const leaves = getLeaves();
        const users = getAllUsers();

        const query = searchInput.value.trim().toLowerCase();
        const selectedStatus = statusFilter.value;

        renderCounts(leaves);
        tableBody.replaceChildren();

        const filteredLeaves = leaves.filter(function (leave) {

            const employee = users.find(function (user) {
                return Number(user.id) === Number(leave.employeeId);
            });

            const employeeName = employee
                ? employee.name
                : "Employee account not found";

            const employeeEmail = employee
                ? employee.email
                : "";

            const searchableText = [
                employeeName,
                employeeEmail,
                leave.type,
                leave.reason,
                leave.from,
                leave.to,
                leave.comment,
                getStatus(leave)
            ].join(" ").toLowerCase();

            const matchesSearch = searchableText.includes(query);

            const matchesStatus =
                selectedStatus === "" ||
                getStatus(leave) === selectedStatus;

            return matchesSearch && matchesStatus;
        });


        // Empty state
        if (filteredLeaves.length === 0) {

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 8;

            cell.textContent = leaves.length === 0
                ? "No leave requests have been submitted yet."
                : "No leave requests match your search or status filter.";

            row.appendChild(cell);
            tableBody.appendChild(row);

            return;
        }


        filteredLeaves.forEach(function (leave) {

            const employee = users.find(function (user) {
                return Number(user.id) === Number(leave.employeeId);
            });

            const row = document.createElement("tr");


            // Employee name and email
            const employeeCell = document.createElement("td");
            const employeeName = document.createElement("strong");

            employeeName.textContent = employee
                ? employee.name
                : "Employee account not found";

            employeeCell.appendChild(employeeName);

            if (employee) {

                const email = document.createElement("small");

                email.textContent = employee.email;
                email.style.display = "block";

                employeeCell.appendChild(email);
            }


            // Leave type
            const typeCell = document.createElement("td");
            typeCell.textContent = leave.type || "—";


            // Date range
            const datesCell = document.createElement("td");

            datesCell.textContent =
                formatDate(leave.from) + " – " +
                formatDate(leave.to);


            // Working days
            const daysCell = document.createElement("td");

            daysCell.textContent = String(
                leave.days ?? countWorkingDays(leave.from, leave.to)
            );


            // Reason
            const reasonCell = document.createElement("td");

            reasonCell.textContent = leave.reason || "—";


            // Status
            const statusCell = document.createElement("td");
            const statusBadge = document.createElement("span");

            statusBadge.className = "pill";
            statusBadge.textContent = getStatus(leave);

            statusCell.appendChild(statusBadge);


            // Admin comment
            const commentCell = document.createElement("td");

            commentCell.textContent = leave.comment || "—";


            // Actions
            const actionsCell = document.createElement("td");

            if (getStatus(leave) === "pending") {

                const commentInput = document.createElement("textarea");

                commentInput.rows = 2;
                commentInput.maxLength = 500;
                commentInput.className = "leave-comment-input";
                commentInput.placeholder = "Admin comment";
                commentInput.value = leave.comment || "";

                const approveButton = document.createElement("button");

                approveButton.type = "button";
                approveButton.className = "btn small";
                approveButton.textContent = "Approve";
                approveButton.dataset.action = "approve";
                approveButton.dataset.id = String(leave.id);

                const rejectButton = document.createElement("button");

                rejectButton.type = "button";
                rejectButton.className = "btn danger small";
                rejectButton.textContent = "Reject";
                rejectButton.dataset.action = "reject";
                rejectButton.dataset.id = String(leave.id);

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

        console.log("[HCM] Leave requests rendered:", filteredLeaves.length);
    }


    // Approve or reject request
    tableBody.addEventListener("click", function (event) {

        const button = event.target.closest("button[data-action]");

        if (!button) {
            return;
        }

        const action = button.dataset.action;
        const requestId = button.dataset.id;

        if (action !== "approve" && action !== "reject") {
            return;
        }

        const leaves = getLeaves();

        const leave = leaves.find(function (item) {
            return String(item.id) === requestId;
        });

        if (!leave) {

            showMessage("Leave request not found. Refresh the page.");

            renderLeaves();

            return;
        }

        if (getStatus(leave) !== "pending") {

            showMessage("This request has already been reviewed.");

            renderLeaves();

            return;
        }

        const row = button.closest("tr");
        const commentInput = row.querySelector(".leave-comment-input");
        const comment = commentInput.value.trim();

        if (!comment) {

            showMessage("Please enter an Admin comment first.");

            commentInput.focus();

            return;
        }


        // Update the original request
        leave.status = action === "approve"
            ? "approved"
            : "rejected";

        leave.comment = comment;


        try {

            saveData("hcm_leaves", leaves);

        } catch (error) {

            console.error("Could not save leave decision:", error);

            showMessage("Could not save this decision. Please try again.");

            return;
        }


        showMessage(
            action === "approve"
                ? "Leave request approved successfully."
                : "Leave request rejected successfully.",
            "success"
        );

        renderLeaves();
    });


    // Search and status filter
    searchInput.addEventListener("input", renderLeaves);

    statusFilter.addEventListener("change", renderLeaves);


    // Logout
    logoutButton.addEventListener("click", function (event) {

        event.preventDefault();

        logoutUser();
    });


    // When Employee changes localStorage in another tab,
    // refresh the Admin table automatically.
    window.addEventListener("storage", function (event) {

        if (
            event.key === "hcm_leaves" ||
            event.key === "hcm_users"
        ) {
            renderLeaves();
        }
    });


    // Initial page load
    console.log("[HCM] Saved leave requests:", getLeaves());

    renderLeaves();

}
