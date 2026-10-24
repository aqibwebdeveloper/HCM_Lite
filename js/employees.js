
/* HCM Lite - Employee Management */

// Check that only Admin can access this page
const currentAdmin = requireAuth("admin");

if (currentAdmin) {

    // Get HTML Elements
    const employeeForm = document.getElementById("employee-form");
    const employeeTableBody = document.getElementById("employee-table-body");

    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("emp-email");
    const departmentInput = document.getElementById("dept");
    const salaryInput = document.getElementById("salary");
    const passwordInput = document.getElementById("emp-password");

    const searchInput = document.getElementById("employee-search");
    const topSearchInput = document.getElementById("top-search");
    const departmentFilter = document.getElementById("department-filter");

    const employeeCount = document.getElementById("employee-count");
    const message = document.getElementById("employee-message");

    const formHeading = document.getElementById("employee-form-heading");
    const saveButton = document.getElementById("save-employee-btn");
    const cancelButton = document.getElementById("cancel-edit-btn");
    const passwordHint = document.getElementById("password-hint");

    const sidebarAdminName = document.getElementById("sidebar-admin-name");
    const topAdminName = document.getElementById("top-admin-name");
    const adminAvatar = document.getElementById("admin-avatar");
    const logoutButton = document.getElementById("logout-btn");

    // Track which employee is being edited
    let editingEmployeeId = null;


    // Display Admin Name
    sidebarAdminName.textContent = currentAdmin.name;
    topAdminName.textContent = currentAdmin.name;
    adminAvatar.textContent = currentAdmin.name.charAt(0).toUpperCase();


    // Show Success or Error Message
    function showMessage(text, type = "error") {
        message.textContent = text;
        message.className = "form-message " + type;
    }


    // Clear Message
    function clearMessage() {
        message.textContent = "";
        message.className = "form-message";
    }


    // Format Salary
    function formatSalary(salary) {
        return "Rs. " + Number(salary).toLocaleString("en-PK");
    }


    // Get Employees From localStorage
    function getEmployees() {
        return getUsers().filter(function (user) {
            return user.role === "employee";
        });
    }


    // Display Employees In The Table
    function renderEmployees() {

        const employees = getEmployees();

        const searchText = searchInput.value.trim().toLowerCase();
        const selectedDepartment = departmentFilter.value;

        // Filter employees by name, email and department
        const filteredEmployees = employees.filter(function (employee) {

            const matchesSearch =
                employee.name.toLowerCase().includes(searchText) ||
                employee.email.toLowerCase().includes(searchText);

            const matchesDepartment =
                selectedDepartment === "" ||
                employee.department === selectedDepartment;

            return matchesSearch && matchesDepartment;

        });

        // Show total employees, not just filtered results
        employeeCount.textContent = employees.length;

        // Remove the previous table rows
        employeeTableBody.replaceChildren();

        // Show a message if there are no matching employees
        if (filteredEmployees.length === 0) {

            const row = document.createElement("tr");
            const cell = document.createElement("td");

            cell.colSpan = 7;

            cell.textContent = employees.length === 0
                ? "No employees yet. Add your first employee below."
                : "No employees match your search.";

            row.appendChild(cell);
            employeeTableBody.appendChild(row);

            return;
        }

        // Create a table row for each employee
        filteredEmployees.forEach(function (employee, index) {

            const row = document.createElement("tr");

            const numberCell = document.createElement("td");
            numberCell.textContent = String(index + 1).padStart(2, "0");

            const nameCell = document.createElement("td");
            const employeeName = document.createElement("strong");
            employeeName.textContent = employee.name;
            nameCell.appendChild(employeeName);

            const emailCell = document.createElement("td");
            emailCell.textContent = employee.email;

            const departmentCell = document.createElement("td");
            departmentCell.textContent = employee.department;

            const salaryCell = document.createElement("td");
            salaryCell.textContent = formatSalary(employee.salary);

            const statusCell = document.createElement("td");
            const statusBadge = document.createElement("span");

            statusBadge.className = "pill";
            statusBadge.textContent = "Active";

            statusCell.appendChild(statusBadge);

            const actionsCell = document.createElement("td");

            // Edit Button
            const editButton = document.createElement("button");

            editButton.type = "button";
            editButton.className = "btn outline small";
            editButton.textContent = "Edit";
            editButton.dataset.action = "edit";
            editButton.dataset.id = employee.id;

            // Delete Button
            const deleteButton = document.createElement("button");

            deleteButton.type = "button";
            deleteButton.className = "btn danger small";
            deleteButton.textContent = "Delete";
            deleteButton.dataset.action = "delete";
            deleteButton.dataset.id = employee.id;

            actionsCell.append(editButton, deleteButton);

            // Add all cells to the row
            row.append(
                numberCell,
                nameCell,
                emailCell,
                departmentCell,
                salaryCell,
                statusCell,
                actionsCell
            );

            employeeTableBody.appendChild(row);

        });
    }


    // Reset Form To Add Mode
    function resetEmployeeForm() {

        employeeForm.reset();

        editingEmployeeId = null;

        formHeading.textContent = "Add New Employee";
        saveButton.textContent = "Save Employee";

        passwordInput.required = true;
        passwordInput.placeholder = "At least 6 characters";

        passwordHint.textContent =
            "Employee login ke liye password create karein.";

        cancelButton.hidden = true;
    }


    // Edit Existing Employee
    function editEmployee(employeeId) {

        const employee = getEmployees().find(function (item) {
            return Number(item.id) === employeeId;
        });

        if (!employee) {
            showMessage("Employee not found.");
            return;
        }

        editingEmployeeId = employeeId;

        nameInput.value = employee.name;
        emailInput.value = employee.email;
        departmentInput.value = employee.department;
        salaryInput.value = employee.salary;

        // Do not display the saved password
        passwordInput.value = "";
        passwordInput.required = false;
        passwordInput.placeholder = "Leave blank to keep current password";

        passwordHint.textContent =
            "Password change karna ho to naya password enter karein.";

        formHeading.textContent = "Edit Employee";
        saveButton.textContent = "Update Employee";
        cancelButton.hidden = false;

        clearMessage();

        // Move to the form
        document.getElementById("add").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        nameInput.focus();
    }


    // Delete Employee
    function deleteEmployee(employeeId) {

        const employees = getEmployees();

        const employee = employees.find(function (item) {
            return Number(item.id) === employeeId;
        });

        if (!employee) {
            showMessage("Employee not found.");
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to delete " + employee.name + "?"
        );

        if (!confirmed) {
            return;
        }

        // Keep the Admin and other users
        const updatedUsers = getUsers().filter(function (user) {
            return Number(user.id) !== employeeId;
        });

        saveUsers(updatedUsers);

        // Reset the form if the deleted employee was being edited
        if (editingEmployeeId === employeeId) {
            resetEmployeeForm();
        }

        renderEmployees();
        showMessage("Employee deleted successfully.", "success");
    }


    // Handle Add And Edit Form
    employeeForm.addEventListener("submit", function (event) {

        event.preventDefault();
        clearMessage();

        const name = nameInput.value.trim();
        const email = emailInput.value.trim().toLowerCase();
        const department = departmentInput.value;
        const salary = Number(salaryInput.value);
        const password = passwordInput.value;

        // Validate required fields
        if (!name || !email || !department || !salaryInput.value) {
            showMessage("Please fill in all required fields.");
            return;
        }

        // Validate salary
        if (!Number.isFinite(salary) || salary <= 0) {
            showMessage("Salary must be greater than zero.");
            salaryInput.focus();
            return;
        }

        // New employee needs a password.
        // During edit, password is optional.
        if (editingEmployeeId === null && password.length < 6) {
            showMessage("Password must contain at least 6 characters.");
            passwordInput.focus();
            return;
        }

        if (editingEmployeeId !== null &&
            password !== "" &&
            password.length < 6) {

            showMessage("A new password must contain at least 6 characters.");
            passwordInput.focus();
            return;
        }

        const users = getUsers();

        // Email must be unique across Admins and Employees
        const emailAlreadyExists = users.some(function (user) {

            return user.email.toLowerCase() === email &&
                Number(user.id) !== editingEmployeeId;

        });

        if (emailAlreadyExists) {
            showMessage("This email address is already in use.");
            emailInput.focus();
            return;
        }


        // UPDATE EMPLOYEE
        if (editingEmployeeId !== null) {

            const updatedUsers = users.map(function (user) {

                if (Number(user.id) === editingEmployeeId) {

                    return {
                        ...user,
                        name: name,
                        email: email,
                        department: department,
                        salary: salary,

                        // Keep existing password unless a new one is provided
                        password: password !== ""
                            ? password
                            : user.password
                    };
                }

                return user;

            });

            saveUsers(updatedUsers);

            resetEmployeeForm();
            renderEmployees();

            showMessage("Employee updated successfully.", "success");

            return;
        }


        // ADD NEW EMPLOYEE
        // Generate a unique ID
        let newId = Date.now();

        while (users.some(function (user) {
            return Number(user.id) === newId;
        })) {
            newId++;
        }

        const newEmployee = {
            id: newId,
            name: name,
            email: email,
            password: password,
            role: "employee",
            department: department,
            salary: salary
        };

        // Save the new account alongside existing users
        users.push(newEmployee);

        saveUsers(users);

        resetEmployeeForm();
        renderEmployees();

        showMessage(
            "Employee added successfully. Their login account has been created.",
            "success"
        );

    });


    // Handle Edit / Delete Button Clicks
    employeeTableBody.addEventListener("click", function (event) {

        const button = event.target.closest("button[data-action]");

        if (!button) {
            return;
        }

        const employeeId = Number(button.dataset.id);

        if (button.dataset.action === "edit") {
            editEmployee(employeeId);
        }

        if (button.dataset.action === "delete") {
            deleteEmployee(employeeId);
        }

    });


    // Search by name or email
    searchInput.addEventListener("input", function () {

        topSearchInput.value = searchInput.value;
        renderEmployees();

    });


    // Topbar search uses the same search field
    topSearchInput.addEventListener("input", function () {

        searchInput.value = topSearchInput.value;
        renderEmployees();

    });


    // Filter by department
    departmentFilter.addEventListener("change", renderEmployees);


    // Cancel Edit
    cancelButton.addEventListener("click", function () {

        resetEmployeeForm();
        clearMessage();

    });


    // Logout
    logoutButton.addEventListener("click", function (event) {

        event.preventDefault();
        logoutUser();

    });


    // Initial table render
    renderEmployees();

}
