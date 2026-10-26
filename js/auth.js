const AUTH_API = "https://dummyjson.com";
const SESSION_KEY = "haven.session";
const TOKEN_LIFETIME_MINS = 60;

const auth = {
  getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
      return null;
    }
  },

  saveSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  async login(username, password) {
    const response = await fetch(`${AUTH_API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, expiresInMins: TOKEN_LIFETIME_MINS }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "We couldn't sign you in. Please try again.");

    const { accessToken, refreshToken, ...user } = data;
    const session = { accessToken, refreshToken, user };
    auth.saveSession(session);
    return session;
  },

  async refresh() {
    const session = auth.getSession();
    if (!session?.refreshToken) return false;

    const response = await fetch(`${AUTH_API}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken, expiresInMins: TOKEN_LIFETIME_MINS }),
    });
    if (!response.ok) return false;

    const { accessToken, refreshToken } = await response.json();
    auth.saveSession({ ...session, accessToken, refreshToken });
    return true;
  },

  // Authenticated fetch: retries once with a refreshed token, and clears the
  // session when the refresh token is no longer valid either.
  async request(path, options = {}) {
    const send = () =>
      fetch(`${AUTH_API}${path}`, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${auth.getSession()?.accessToken}` },
      });

    let response = await send();
    if (response.status === 401) {
      if (!(await auth.refresh())) {
        auth.logout();
        throw new AuthError();
      }
      response = await send();
    }
    if (!response.ok) throw new Error("The account service is unavailable.");
    return response.json();
  },
};

class AuthError extends Error {
  constructor() {
    super("Your session has expired. Please sign in again.");
    this.name = "AuthError";
  }
}

function renderAccountLink() {
  const link = document.getElementById("account-link");
  if (!link) return;
  const user = auth.getSession()?.user;
  link.href = user ? "dashboard.html" : "login.html";
  link.textContent = user ? `Hi, ${user.firstName}` : "Sign in";
}

renderAccountLink();
