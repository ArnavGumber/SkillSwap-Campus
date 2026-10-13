const loginForm = document.querySelector("#login-form");
const studentIdInput = document.querySelector("#student-id");
const passwordInput = document.querySelector("#password");
const loginButton = document.querySelector("#login-submit");
const loginFeedback = document.querySelector("#login-feedback");
const passwordToggle = document.querySelector("[data-password-toggle]");

function setFieldError(input, message) {
  const error = document.querySelector(`#${input.id}-error`);
  input.setAttribute("aria-invalid", message ? "true" : "false");
  error.textContent = message;
}

function clearLoginErrors() {
  setFieldError(studentIdInput, "");
  setFieldError(passwordInput, "");
  loginFeedback.textContent = "";
}

passwordToggle.addEventListener("click", () => {
  const showingPassword = passwordInput.type === "password";
  passwordInput.type = showingPassword ? "text" : "password";
  passwordToggle.setAttribute("aria-pressed", String(showingPassword));
  passwordToggle.setAttribute("aria-label", showingPassword ? "Hide password" : "Show password");
  passwordInput.focus();
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearLoginErrors();

  const studentId = studentIdInput.value.trim();
  const password = passwordInput.value;
  let isValid = true;

  if (!studentId) {
    setFieldError(studentIdInput, "Enter your student ID.");
    isValid = false;
  }
  if (!password) {
    setFieldError(passwordInput, "Enter your password.");
    isValid = false;
  }
  if (!isValid) {
    (studentId ? passwordInput : studentIdInput).focus();
    return;
  }

  if (studentId.toUpperCase() !== "UIET2026001" || password !== "demo123") {
    loginFeedback.textContent = "Those details don't match the sample account. Try the demo credentials shown above.";
    studentIdInput.setAttribute("aria-invalid", "true");
    passwordInput.setAttribute("aria-invalid", "true");
    passwordInput.focus();
    return;
  }

  loginButton.disabled = true;
  loginButton.classList.add("is-loading");
  loginButton.setAttribute("aria-busy", "true");
  loginButton.querySelector(".button-label").textContent = "Opening your workspace";
  window.setTimeout(() => window.location.assign("./dashboard"), 650);
});

document.querySelector("[data-forgot-password]").addEventListener("click", () => {
  const toast = document.querySelector("#login-toast");
  toast.innerHTML = '<div class="toast">This is a demo account, so password recovery is not connected. Use <strong>demo123</strong> to continue.</div>';
  window.setTimeout(() => { toast.replaceChildren(); }, 4200);
});