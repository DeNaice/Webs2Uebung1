

interface User {
  id: number;
  givenName: string;
  familyName: string;
  creationTime: string;
}

let socket = io.connect(window.location.protocol + '//' + window.location.host);

socket.on(`gets_edited`, function (data){});
socket.on(`done_edited`, function (data){});
socket.on(`delete`, function (data){});

document.addEventListener("DOMContentLoaded", () => {
  //--- check, if user is already logged in (e.g. after refresh) -------------------------------------------------------
  checkLogin();

  // Event handler of the add user button
  document.getElementById("add-user-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    let usernameEl = document.getElementById("add-user-username") as HTMLInputElement;
    let passwordEl = document.getElementById("add-user-password") as HTMLInputElement;
    let givenNameEl = document.getElementById("add-user-given-name") as HTMLInputElement;
    let familyNameEl = document.getElementById("add-user-family-name") as HTMLInputElement;
    let username = usernameEl.value;
    let password = passwordEl.value;
    let givenName = givenNameEl.value;
    let familyName = familyNameEl.value;

    // Check, if any given value is empty.
    // Don't allow creation of users without given name or family name.
    if (givenName.length == 0 || familyName.length == 0 || username.length == 0 || password.length == 0) {
      addMessage("The given name or family name is empty.")
      return;
    }

    // Send user data via http to server using the route /user
    const res = await fetch('/user', {
      method: 'post',
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify({ givenName, familyName, username, password })
    });
    const data = await res.json();

    addMessage(data.message);

    // Update the html
    readUsers();

    // Clear the input fields
    usernameEl.value = "";
    passwordEl.value = "";
    givenNameEl.value = "";
    familyNameEl.value = "";
  });

  // Handler of the modal's 'save' button
  document.getElementById("edit-user-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    let idEl = document.getElementById("edit-user-id") as HTMLInputElement;
    let givenNameEl = document.getElementById("edit-user-given-name") as HTMLInputElement;
    let familyNameEl = document.getElementById("edit-user-family-name") as HTMLInputElement;

    // Read the user's id from the hidden field.
    let userId = Number(idEl.value);
    let givenName = givenNameEl.value;
    let familyName = familyNameEl.value;

    const res = await fetch('/user/' + userId, {
      method: 'put',
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify({ givenName, familyName }),
    });
    const data = await res.json();
    addMessage(data.message);

    // Hide the modal window
    bootstrap.Modal.getInstance(document.getElementById("edit-user-modal")).hide();

    // Update the html
    readUsers();
  });

  document.getElementById("login-form").addEventListener("submit", async (event: SubmitEvent) => {
    event.preventDefault();
    const usernameInput: HTMLInputElement = document.getElementById('login-user-username-input') as HTMLInputElement;
    const passwordInput: HTMLInputElement = document.getElementById('login-user-password-input') as HTMLInputElement;

    const data: Object = {username: usernameInput.value, password: passwordInput.value};

    const response = await fetch('http://localhost:8080/login', {
        method: "POST",
        headers: {
          "Content-type": "application/json"
        },
        body: JSON.stringify(data),
      }
    );

    if (response.status === 400 || response.status === 401) {
      const data = await response.json();
      addMessage(data.message);
    } else if (response.status === 200) {
      const data = await response.json();
      addMessage(data.message);
      showLoggedInStatus(data);
    } else {
      console.warn(`Unhandled response code (${response.status}).`)
    }
  });

  document.getElementById("logout-form").addEventListener("submit", async (event: SubmitEvent) => {
    event.preventDefault();
    await fetch('http://localhost:8080/logout', {
        method: "POST",
      }
    );
    showLoggedOutStatus()
  });
});

/**
 * Checks if user might be logged
 */
async function checkLogin() {
  const response = await fetch('/login',
    {
      method: "GET"
    }
  )
  if (response.status === 200) {
    const data = await response.json();
    showLoggedInStatus(data);
  }
}

/**
 * Gets and displays all users
 */
async function readUsers() {
  const res = await fetch('/users');
  const data = await res.json();
  renderList(data.userList);
}

/**
 * Displays the logged in username
 */
function showLoggedInStatus(data: any) {
  const user: User = data.user;

  const username: HTMLSpanElement = document.getElementById('current-user-username') as HTMLSpanElement;
  username.innerHTML = `Hello ${user.givenName}`;

  const addUserForm: HTMLDivElement = document.getElementById('add-user-container') as HTMLDivElement;
  addUserForm.classList.remove("d-none"); // show content area

  const contentArea: HTMLDivElement = document.getElementById('user-list-container') as HTMLDivElement;
  contentArea.classList.remove("d-none"); // show content area

  const login: HTMLDivElement = document.getElementById('login-container') as HTMLDivElement;
  login.classList.add("d-none"); // hide login

  const logout: HTMLDivElement = document.getElementById('logout-container') as HTMLDivElement;
  logout.classList.remove("d-none"); // show logout

  (document.getElementById('login-form') as HTMLFormElement).reset();

  readUsers();
}

/**
 * Resets the site to the logged-out state.
 * Clears user list, shows login form, hides logout form-
 */
function showLoggedOutStatus() {
  const username: HTMLSpanElement = document.getElementById('current-user-username') as HTMLSpanElement;
  username.innerHTML = ``;

  const addUserForm: HTMLDivElement = document.getElementById('add-user-container') as HTMLDivElement;
  addUserForm.classList.add("d-none"); // hide content area

  const contentArea: HTMLDivElement = document.getElementById('user-list-container') as HTMLDivElement;
  contentArea.classList.add("d-none"); // hide content area

  const login: HTMLDivElement = document.getElementById('login-container') as HTMLDivElement;
  login.classList.remove("d-none"); // show login

  const logout: HTMLDivElement = document.getElementById('logout-container') as HTMLDivElement;
  logout.classList.add("d-none"); // hide logout

  (document.getElementById('add-user-form') as HTMLFormElement).reset();
}


/**
 * 1) Clears the user table.
 * 2) Adds all users to the table.
 */
function renderList(userList: User[]) {
  let userListEl = document.getElementById("user-list");

  // Remove all entries from the table
  userListEl.replaceChildren();

  for (let user of userList) {
    // The new table row
    let tr = document.createElement("tr");

    // ID cell
    let tdId = document.createElement("td");
    tdId.textContent = user.id.toString();

    // Given name cell
    let tdGivenName = document.createElement("td");
    tdGivenName.textContent = user.givenName;

    // Family name cell
    let tdFamilyName = document.createElement("td");
    tdFamilyName.textContent = user.familyName;

    // Creation date cell
    let tdDate = document.createElement("td");
    tdDate.textContent = user.creationTime;

    // Buttons cell
    let tdButtons = document.createElement("td");

    // Delete button
    let deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-danger";
    deleteButton.addEventListener("click", async () => {
      const res = await fetch('/user/' + user.id,{
        method: 'delete'
      });
      const data = await res.json();
      addMessage(data.message);
      readUsers();
    });

    // Delete button icon
    let deleteButtonIcon = document.createElement("i");
    deleteButtonIcon.className = "fa-solid fa-trash";
    deleteButton.append(deleteButtonIcon);

    // Edit button
    let editButton = document.createElement("button");
    editButton.className = "btn btn-primary ms-3";
    editButton.addEventListener("click", () => {
      showEditModal(user);
    });

    // Edit button icon
    let editButtonIcon = document.createElement("i");
    editButtonIcon.className = "fa-solid fa-pen";
    editButton.append(editButtonIcon);

    // Adds the buttons to the button cell
    tdButtons.append(deleteButton, editButton);

    // Add the cells to the table row
    tr.append(tdId, tdGivenName, tdFamilyName, tdDate, tdButtons);

    // Add the table row to the table
    userListEl.append(tr);
  }
}

/**
 * 1) Fills the modal window with the given user's data.
 * 2) Opens the modal window.
 */
function showEditModal(user: User) {
  let idEl = document.getElementById("edit-user-id") as HTMLInputElement;
  let givenNameEl = document.getElementById("edit-user-given-name") as HTMLInputElement;
  let familyNameEl = document.getElementById("edit-user-family-name") as HTMLInputElement;

  // Write the user's id into the hidden field.
  idEl.value = user.id.toString();

  // Write the user's data into the text fields.
  givenNameEl.value = user.givenName;
  familyNameEl.value = user.familyName;

  // Initialise the modal functionality. Enables the methods `.show()` and `.hide()`.
  const modal = new bootstrap.Modal(document.getElementById("edit-user-modal"));

  // Show the modal window.
  modal.show();
}

/**
 * Creates a new alert message.
 */
function addMessage(message: string) {
  const messagesEl = document.getElementById('messages');

  // The alert element
  let alertEl: HTMLElement = document.createElement('div');
  alertEl.classList.add('alert', 'alert-warning', 'alert-dismissible', 'fade', 'show');
  alertEl.setAttribute('role', 'alert');
  alertEl.textContent = message;

  // Close button
  let buttonEl: HTMLElement = document.createElement("button");
  // btn-close changes the button into an 'X' icon.
  buttonEl.className = "btn-close";
  // data-bs-dismiss enables the button to automatically close the alert on click.
  buttonEl.setAttribute("data-bs-dismiss", "alert");

  // Add the close button to the alert.
  alertEl.appendChild(buttonEl);

  // Convert to Bootstrap Alert type
  const alert: bootstrap.Alert = new bootstrap.Alert(alertEl);

  // Add message to DOM
  messagesEl.appendChild(alertEl);

  // Auto-remove message after 5 seconds (5000ms)
  setTimeout(() => {
    alert.close();
  }, 5000);
}
