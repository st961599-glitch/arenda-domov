import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/** ====== ВСТАВЬ СВОИ ДАННЫЕ FIREBASE ======
 *  Firebase Console -> Project settings -> Your apps -> Firebase SDK snippet
 *  ПОЛЕт “firebaseConfig” вставь целиком как объект.
 */
const firebaseConfig = {
  apiKey: "ВАШ_API_KEY",
  authDomain: "ВАШ_AUTH_DOMAIN",
  projectId: "ВАШ_PROJECT_ID",
  storageBucket: "ВАШ_STORAGE_BUCKET",
  messagingSenderId: "ВАШ_MESSAGING_SENDER_ID",
  appId: "ВАШ_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// UI
const authSection = document.getElementById("authSection");
const authTitle = document.getElementById("authTitle");
const authForm = document.getElementById("authForm");
const authSubmit = document.getElementById("authSubmit");
const authMsg = document.getElementById("authMsg");
const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");

const showLoginBtn = document.getElementById("showLogin");
const showRegisterBtn = document.getElementById("showRegister");
const logoutBtn = document.getElementById("logoutBtn");

const authGuest = document.getElementById("auth-guest");
const authUser = document.getElementById("auth-user");
const userEmailEl = document.getElementById("userEmail");

const listingForm = document.getElementById("listingForm");
const listingMsg = document.getElementById("listingMsg");

const listingsEl = document.getElementById("listings");
const refreshBtn = document.getElementById("refreshBtn");
const countText = document.getElementById("countText");

const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const clearCartBtn = document.getElementById("clearCartBtn");
const checkoutBtn = document.getElementById("checkoutBtn");
const cartMsg = document.getElementById("cartMsg");

let currentUser = null;
let authMode = "login"; // "login" | "register"

// Cart helpers (store per-user)
function cartKey(uid) {
  return `cart:${uid}`;
}
function loadCart(uid) {
  try {
    return JSON.parse(localStorage.getItem(cartKey(uid))) || [];
  } catch {
    return [];
  }
}
function saveCart(uid, cart) {
  localStorage.setItem(cartKey(uid), JSON.stringify(cart));
}
function formatRUB(n) {
  return new Intl.NumberFormat("ru-RU").format(Number(n || 0)) + " ₽";
}

function renderCart() {
  cartMsg.textContent = "";
  if (!currentUser) {
    cartItemsEl.innerHTML = `<div class="muted">Войдите, чтобы использовать корзину.</div>`;
    cartTotalEl.textContent = "0 ₽";
    return;
  }

  const cart = loadCart(currentUser.uid);

  if (cart.length === 0) {
    cartItemsEl.innerHTML = `<div class="muted">Корзина пуста. Добавьте объявление.</div>`;
    cartTotalEl.textContent = "0 ₽";
    return;
  }

  cartItemsEl.innerHTML = cart.map(item => {
    return `
      <div class="cart-item">
        <div class="left">
          <div class="name">${escapeHtml(item.title)}</div>
          <div class="meta">${formatRUB(item.price)} × ${item.qty} = ${formatRUB(item.price * item.qty)}</div>
        </div>
        <div class="right">
          <button class="smallBtn" data-action="minus" data-id="${item.id}">−</button>
          <button class="smallBtn" data-action="plus" data-id="${item.id}">+</button>
          <button class="smallBtn" data-action="remove" data-id="${item.id}">Удалить</button>
        </div>
      </div>
    `;
  }).join("");

  const total = cart.reduce((sum, it) => sum + it.price * it.qty, 0);
  cartTotalEl.textContent = formatRUB(total);

  cartItemsEl.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.getAttribute("data-id");
      const action = e.currentTarget.getAttribute("data-action");
      updateCartItem(id, action);
    });
  });
}

function updateCartItem(id, action) {
  if (!currentUser) return;

  const cart = loadCart(currentUser.uid);
  const idx = cart.findIndex(x => x.id === id);
  if (idx === -1) return;

  if (action === "plus") cart[idx].qty += 1;
  if (action === "minus") cart[idx].qty -= 1;
  if (action === "remove") cart.splice(idx, 1);

  if (action === "minus" && cart[idx] && cart[idx].qty <= 0) {
    cart.splice(idx, 1);
  }

  saveCart(currentUser.uid, cart);
  renderCart();
}

function addToCart(listing) {
  if (!currentUser) {
    cartMsg.textContent = "Войдите, чтобы добавить в корзину.";
    return;
  }
  cartMsg.textContent = "";

  const cart = loadCart(currentUser.uid);
  const idx = cart.findIndex(x => x.id === listing.id);

  if (idx === -1) {
    cart.push({ id: listing.id, title: listing.title, price: listing.price, qty: 1 });
  } else {
    cart[idx].qty += 1;
  }

  saveCart(currentUser.uid, cart);
  renderCart();
}

// Escape for HTML injection safety
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&")
    .replaceAll("<", "<")
    .replaceAll(">", ">")
    .replaceAll('"', """)
    .replaceAll("'", "'");
}

// Listings
async function loadListings() {
  listingsEl.innerHTML = `<div class="muted">Загрузка...</div>`;
  const q = query(collection(db, "listings"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  if (items.length === 0) {
    listingsEl.innerHTML = `<div class="muted">Пока нет объявлений. Добавьте первое!</div>`;
  } else {
    listingsEl.innerHTML = items.map(it => {
      return `
        <div class="listing">
          <div class="listing-main">
            <div class="listing-title">${escapeHtml(it.title)}</div>
            <div class="listing-desc">${escapeHtml(it.description || "")}</div>
            <span class="badge-price">${formatRUB(it.price)}/мес</span>
          </div>
          <div class="listing-actions">
            <button data
to be continued...

