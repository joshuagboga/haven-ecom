const loginEl = {
  form: document.getElementById("login-form"),
  username: document.getElementById("username"),
  password: document.getElementById("password"),
  error: document.getElementById("login-error"),
  submit: document.getElementById("login-submit"),
  demo: document.getElementById("demo-fill"),
};

function showError(message) {
  loginEl.error.textContent = message;
  loginEl.error.classList.toggle("hidden", !message);
}

function setLoading(loading) {
  loginEl.submit.disabled = loading;
  loginEl.submit.textContent = loading ? "Signing in…" : "Sign in";
}

if (auth.getSession()) window.location.replace("dashboard.html");

loginEl.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = loginEl.username.value.trim();
  const password = loginEl.password.value;

  if (!username || !password) {
    showError("Enter your username and password.");
    return;
  }

  showError("");
  setLoading(true);
  try {
    await auth.login(username, password);
    window.location.replace("dashboard.html");
  } catch (error) {
    showError(error.message);
    setLoading(false);
  }
});

loginEl.demo.addEventListener("click", () => {
  loginEl.username.value = "emilys";
  loginEl.password.value = "emilyspass";
  loginEl.submit.focus();
});
