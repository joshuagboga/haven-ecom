const signupEl = {
  form: document.getElementById("signup-form"),
  error: document.getElementById("signup-error"),
  submit: document.getElementById("signup-submit"),
};

function showError(message) {
  signupEl.error.textContent = message;
  signupEl.error.classList.toggle("hidden", !message);
}

function setLoading(loading) {
  signupEl.submit.disabled = loading;
  signupEl.submit.textContent = loading ? "Creating account…" : "Create account";
}

function validate(details) {
  if (Object.values(details).some((value) => !value)) return "Fill in all the fields.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) return "Enter a valid email address.";
  if (!/^[a-z0-9_.]{3,}$/i.test(details.username)) return "Usernames need 3+ letters, numbers, dots or underscores.";
  if (details.password.length < 6) return "Passwords need at least 6 characters.";
  return "";
}

if (auth.getSession()) window.location.replace("dashboard.html");

signupEl.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(signupEl.form);
  const details = {
    firstName: form.get("firstName").trim(),
    lastName: form.get("lastName").trim(),
    email: form.get("email").trim(),
    username: form.get("username").trim(),
    password: form.get("password"),
  };

  const problem = validate(details);
  showError(problem);
  if (problem) return;

  setLoading(true);
  try {
    await auth.signup(details);
    window.location.replace("dashboard.html");
  } catch (error) {
    showError(error.message);
    setLoading(false);
  }
});
