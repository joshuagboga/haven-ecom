const dashboard = {
  user: null,
  carts: [],
  loading: true,
  error: "",
};

const root = document.getElementById("dashboard");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatPrice(value) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getStats() {
  return dashboard.carts.reduce(
    (stats, cart) => ({
      orders: stats.orders + 1,
      items: stats.items + cart.totalQuantity,
      spent: stats.spent + cart.discountedTotal,
      saved: stats.saved + (cart.total - cart.discountedTotal),
    }),
    { orders: 0, items: 0, spent: 0, saved: 0 },
  );
}

function renderSkeleton() {
  const block = (classes) => `<div class="animate-pulse rounded-3xl bg-black/5 ${classes}"></div>`;
  root.innerHTML = `
    ${block("h-12 w-2/3 max-w-lg")}
    <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">${block("h-32").repeat(4)}</div>
    <div class="mt-8 max-w-2xl">${block("h-96")}</div>`;
}

function renderError() {
  root.innerHTML = `<div class="rounded-3xl border border-[#d75f36]/20 bg-[#d75f36]/5 p-10 text-center">
    <p class="font-semibold text-[#9b3e20]">${escapeHtml(dashboard.error)}</p>
    <button type="button" data-retry class="mt-4 text-sm font-bold underline underline-offset-4">Try again</button>
  </div>`;
}

function renderStat(label, value) {
  return `<div class="rounded-3xl bg-white p-6">
    <p class="text-xs font-bold uppercase tracking-[0.15em] text-black/40">${label}</p>
    <p class="mt-3 text-3xl font-bold tracking-[-0.04em]">${value}</p>
  </div>`;
}

function renderDetail(label, value) {
  if (!value) return "";
  return `<div class="flex justify-between gap-4 border-b border-black/8 py-3 text-sm last:border-0">
    <dt class="text-black/45">${label}</dt>
    <dd class="text-right font-semibold">${escapeHtml(value)}</dd>
  </div>`;
}

function renderProfile() {
  const { user } = dashboard;
  const address = user.address?.address
    ? `${user.address.address}, ${user.address.city}, ${user.address.stateCode} ${user.address.postalCode}`
    : "";
  const company = user.company?.name ? `${user.company.title}, ${user.company.name}` : "";
  const avatar = user.image
    ? `<img src="${escapeHtml(user.image)}" alt="" class="h-16 w-16 rounded-full bg-[#f7f6f2]" />`
    : `<span class="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#1d4d35] text-xl font-bold text-white">${escapeHtml(
        `${user.firstName[0]}${user.lastName[0]}`.toUpperCase(),
      )}</span>`;

  return `<section class="h-fit rounded-3xl bg-white p-6 sm:p-8" aria-label="Profile">
    <div class="flex items-center gap-4">
      ${avatar}
      <div class="min-w-0">
        <p class="truncate text-xl font-bold tracking-[-0.03em]">${escapeHtml(`${user.firstName} ${user.lastName}`)}</p>
        <p class="truncate text-sm text-black/45">@${escapeHtml(user.username)}</p>
      </div>
    </div>
    <dl class="mt-6">
      ${renderDetail("Email", user.email)}
      ${renderDetail("Phone", user.phone)}
      ${renderDetail("Birthday", user.birthDate)}
      ${renderDetail("Address", address)}
      ${renderDetail("Work", company)}
    </dl>
  </section>`;
}

function renderDashboard() {
  if (dashboard.loading) return renderSkeleton();
  if (dashboard.error) return renderError();

  const stats = getStats();

  root.innerHTML = `
    <p class="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#d75f36]">Your account</p>
    <h1 class="text-4xl font-bold tracking-[-0.045em] sm:text-5xl">Welcome back, ${escapeHtml(dashboard.user.firstName)}.</h1>

    <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      ${renderStat("Orders", stats.orders)}
      ${renderStat("Items bought", stats.items)}
      ${renderStat("Total spent", formatPrice(stats.spent))}
      ${renderStat("You saved", formatPrice(stats.saved))}
    </div>

    <div class="mt-8 max-w-2xl">${renderProfile()}</div>`;
}

function redirectToLogin() {
  window.location.replace("login.html");
}

async function loadDashboard() {
  dashboard.loading = true;
  dashboard.error = "";
  renderDashboard();

  const session = auth.getSession();
  if (session.local) {
    dashboard.user = session.user;
    dashboard.carts = [];
    dashboard.loading = false;
    return renderDashboard();
  }

  try {
    const user = await auth.request("/auth/me");
    const { carts } = await auth.request(`/carts/user/${user.id}`);
    dashboard.user = user;
    dashboard.carts = carts;
  } catch (error) {
    if (error instanceof AuthError) return redirectToLogin();
    dashboard.error = "We couldn't load your account. Please try again.";
  }
  dashboard.loading = false;
  renderDashboard();
}

root.addEventListener("click", (event) => {
  if (event.target.closest("[data-retry]")) loadDashboard();
});

document.getElementById("logout").addEventListener("click", () => {
  auth.logout();
  window.location.replace("index.html");
});

if (auth.getSession()) {
  loadDashboard();
} else {
  redirectToLogin();
}
