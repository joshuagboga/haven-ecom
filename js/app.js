const API_URL = "https://fakestoreapi.com/products";

const ICONS = {
  bag: '<path d="M6 8h12l-1 12H7L6 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" />',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />',
  plus: '<path d="M12 5v14M5 12h14" />',
  minus: '<path d="M5 12h14" />',
};

const state = {
  products: [],
  cart: [],
  category: "all",
  query: "",
  loading: true,
  error: "",
};

const el = {
  search: document.getElementById("search"),
  categories: document.getElementById("categories"),
  products: document.getElementById("products"),
  badge: document.getElementById("cart-badge"),
  drawer: document.getElementById("cart-drawer"),
  cartCount: document.getElementById("cart-count"),
  cartItems: document.getElementById("cart-items"),
  cartFooter: document.getElementById("cart-footer"),
  cartTotal: document.getElementById("cart-total"),
};

function icon(name, className = "h-5 w-5") {
  return `<svg aria-hidden="true" class="${className}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCategory(category) {
  return category.replace("'s clothing", "").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPrice(value) {
  return `$${value.toFixed(2)}`;
}

function getVisibleProducts() {
  const search = state.query.trim().toLowerCase();
  return state.products.filter(
    (product) =>
      (state.category === "all" || product.category === state.category) &&
      (!search ||
        product.title.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search)),
  );
}

function renderCategories() {
  const categories = ["all", ...new Set(state.products.map((product) => product.category))];
  el.categories.innerHTML = categories
    .map((item) => {
      const active = state.category === item;
      const classes = active
        ? "bg-[#1d4d35] text-white"
        : "border border-black/10 bg-[#f7f6f2] text-black/60 hover:border-black/30";
      return `<button type="button" data-category="${escapeHtml(item)}" class="shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition ${classes}">
        ${item === "all" ? "All products" : escapeHtml(formatCategory(item))}
      </button>`;
    })
    .join("");
}

function renderProducts() {
  if (state.loading) {
    const skeleton = `<div class="animate-pulse">
      <div class="aspect-[4/5] rounded-3xl bg-black/5"></div>
      <div class="mt-5 h-4 w-2/3 rounded bg-black/5"></div>
      <div class="mt-3 h-4 w-1/3 rounded bg-black/5"></div>
    </div>`;
    el.products.innerHTML = `<div class="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">${skeleton.repeat(8)}</div>`;
    return;
  }

  if (state.error) {
    el.products.innerHTML = `<div class="rounded-3xl border border-[#d75f36]/20 bg-[#d75f36]/5 p-10 text-center">
      <p class="font-semibold text-[#9b3e20]">${escapeHtml(state.error)}</p>
      <button type="button" data-reload class="mt-4 text-sm font-bold underline underline-offset-4">Reload the page</button>
    </div>`;
    return;
  }

  const visible = getVisibleProducts();
  const cards = visible
    .map((product) => {
      const title = escapeHtml(product.title);
      const category = escapeHtml(formatCategory(product.category));
      return `<article class="group">
        <div class="relative aspect-[4/5] overflow-hidden rounded-3xl bg-[#f7f6f2] p-8">
          <img src="${escapeHtml(product.image)}" alt="${title}" loading="lazy" class="h-full w-full object-contain mix-blend-multiply transition duration-500 group-hover:scale-105" />
          <span class="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur">${category}</span>
          <button type="button" data-add="${product.id}" aria-label="Add ${title} to cart" class="absolute bottom-4 right-4 grid h-12 w-12 translate-y-2 place-items-center rounded-full bg-[#172019] text-white opacity-0 shadow-lg transition duration-300 hover:bg-[#d75f36] group-hover:translate-y-0 group-hover:opacity-100 focus:translate-y-0 focus:opacity-100">
            ${icon("plus")}
          </button>
        </div>
        <div class="mt-5">
          <div class="mb-2 flex items-center gap-1.5 text-xs text-black/45">
            ${icon("star", "h-3.5 w-3.5 fill-[#e7a83e] stroke-[#e7a83e]")}
            <span>${product.rating.rate}</span>
            <span>(${product.rating.count})</span>
          </div>
          <h3 class="line-clamp-2 min-h-12 font-semibold leading-6">${title}</h3>
          <div class="mt-3 flex items-center justify-between">
            <p class="text-lg font-bold">${formatPrice(product.price)}</p>
            <button type="button" data-add="${product.id}" class="text-sm font-bold text-[#1d4d35] underline decoration-[#1d4d35]/25 underline-offset-4 sm:hidden">Add to cart</button>
          </div>
        </div>
      </article>`;
    })
    .join("");

  const empty =
    visible.length === 0
      ? `<div class="py-24 text-center">
          <p class="text-xl font-bold">Nothing found</p>
          <p class="mt-2 text-black/50">Try another search or category.</p>
        </div>`
      : "";

  el.products.innerHTML = `<p class="mb-6 text-sm text-black/45">${visible.length} items</p>
    <div class="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">${cards}</div>
    ${empty}`;
}

function renderCart() {
  const count = state.cart.reduce((total, item) => total + item.quantity, 0);
  const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  el.badge.textContent = count;
  el.cartCount.textContent = `${count} items`;
  el.cartTotal.textContent = formatPrice(total);
  el.cartFooter.classList.toggle("hidden", state.cart.length === 0);

  if (state.cart.length === 0) {
    el.cartItems.innerHTML = `<div class="grid h-full place-items-center text-center">
      <div>
        <span class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white text-black/35">${icon("bag", "h-7 w-7")}</span>
        <p class="mt-5 font-bold">Your cart is empty</p>
        <p class="mt-1 text-sm text-black/45">Add something you love.</p>
      </div>
    </div>`;
    return;
  }

  el.cartItems.innerHTML = state.cart
    .map((item) => {
      const title = escapeHtml(item.title);
      return `<div class="flex gap-4 rounded-2xl bg-white p-3">
        <div class="h-24 w-20 shrink-0 rounded-xl bg-[#f7f6f2] p-3">
          <img src="${escapeHtml(item.image)}" alt="" class="h-full w-full object-contain mix-blend-multiply" />
        </div>
        <div class="flex min-w-0 flex-1 flex-col justify-between py-1">
          <div>
            <p class="line-clamp-2 text-sm font-semibold">${title}</p>
            <p class="mt-1 text-sm font-bold">${formatPrice(item.price)}</p>
          </div>
          <div class="flex w-fit items-center rounded-full border border-black/10">
            <button type="button" data-qty="-1" data-id="${item.id}" aria-label="Remove one ${title}" class="grid h-7 w-8 place-items-center">${icon("minus", "h-3 w-3")}</button>
            <span class="w-6 text-center text-xs font-bold">${item.quantity}</span>
            <button type="button" data-qty="1" data-id="${item.id}" aria-label="Add one ${title}" class="grid h-7 w-8 place-items-center">${icon("plus", "h-3 w-3")}</button>
          </div>
        </div>
      </div>`;
    })
    .join("");
}

function openCart() {
  el.drawer.classList.remove("hidden");
}

function closeCart() {
  el.drawer.classList.add("hidden");
}

function addToCart(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  const match = state.cart.find((item) => item.id === productId);
  if (match) {
    match.quantity += 1;
  } else {
    state.cart.push({ ...product, quantity: 1 });
  }
  renderCart();
  openCart();
}

function updateQuantity(productId, amount) {
  state.cart = state.cart
    .map((item) => (item.id === productId ? { ...item, quantity: item.quantity + amount } : item))
    .filter((item) => item.quantity > 0);
  renderCart();
}

async function loadProducts() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("The product service is unavailable.");
    state.products = await response.json();
  } catch {
    state.error = "We couldn't load the collection. Please try again.";
  } finally {
    state.loading = false;
    renderCategories();
    renderProducts();
  }
}

el.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderProducts();
});

el.categories.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  renderCategories();
  renderProducts();
});

el.products.addEventListener("click", (event) => {
  if (event.target.closest("[data-reload]")) {
    window.location.reload();
    return;
  }
  const button = event.target.closest("[data-add]");
  if (button) addToCart(Number(button.dataset.add));
});

el.cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("[data-qty]");
  if (button) updateQuantity(Number(button.dataset.id), Number(button.dataset.qty));
});

document.querySelectorAll("[data-open-cart]").forEach((button) => button.addEventListener("click", openCart));
document.querySelectorAll("[data-close-cart]").forEach((button) => button.addEventListener("click", closeCart));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeCart();
});

renderCategories();
renderProducts();
renderCart();
loadProducts();
