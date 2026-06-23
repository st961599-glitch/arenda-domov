// Импорт необходимых модулей SDK Firebase v10+
import { initializeApp } from "https://gstatic.com";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://gstatic.com";
import { getDatabase, ref, set, push, onValue } from "https://gstatic.com";

// НАСТРОЙКА FIREBASE (Вставьте сюда свои ключи из консоли Firebase)
const firebaseConfig = {
    apiKey: "ВАШ_API_KEY",
    authDomain: "ВАШ_PROJECT_://firebaseapp.com",
    databaseURL: "https://ВАШ_PROJECT_://firebaseio.com",
    projectId: "ВАШ_PROJECT_ID",
    storageBucket: "ВАШ_PROJECT_://appspot.com",
    messagingSenderId: "ВАШ_ОТПРАВИТЕЛЬ",
    appId: "ВАШ_APP_ID"
};

// Инициализация
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// DOM Элементы
const authSection = document.getElementById('auth-section');
const mainContent = document.getElementById('main-content');
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('auth-email');
const passwordInput = document.getElementById('auth-password');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');

const listingForm = document.getElementById('listing-form');
const houseTitle = document.getElementById('house-title');
const housePrice = document.getElementById('house-price');
const listingsGrid = document.getElementById('listings-grid');

const cartList = document.getElementById('cart-list');
const cartSum = document.getElementById('cart-sum');

// Состояние приложения
let currentUser = null;
let cart = [];

// --- Авторизация ---

// Регистрация
registerBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        authForm.reset();
    } catch (error) {
        alert("Ошибка регистрации: " + error.message);
    }
});

// Вход
loginBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        authForm.reset();
    } catch (error) {
        alert("Ошибка входа: " + error.message);
    }
});

// Выход
logoutBtn.addEventListener('click', () => signOut(auth));

// Слушатель изменения состояния пользователя
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        userInfo.textContent = user.email;
        authSection.classList.add('hidden');
        mainContent.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        loadListings(); // Загружаем объявления из БД
    } else {
        currentUser = null;
        userInfo.textContent = '';
        authSection.classList.remove('hidden');
        mainContent.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        listingsGrid.innerHTML = '';
        cart = [];
        updateCartUI();
    }
});

// --- Работа с объявлениями (Firebase Realtime Database) ---

// Создание объявления
listingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const title = houseTitle.value;
    const price = Number(housePrice.value);

    try {
        const listingsRef = ref(database, 'listings');
        const newListingRef = push(listingsRef); // Создаем уникальный ID
        await set(newListingRef, {
            title: title,
            price: price,
            createdBy: currentUser.uid
        });
        listingForm.reset();
    } catch (error) {
        alert("Не удалось добавить объявление: " + error.message);
    }
});

// Получение объявлений в реальном времени
function loadListings() {
    const listingsRef = ref(database, 'listings');
    onValue(listingsRef, (snapshot) => {
        listingsGrid.innerHTML = '';
        const data = snapshot.val();
        if (!data) return;

        Object.keys(data).forEach((id) => {
            const item = data[id];
            createHouseCard(id, item.title, item.price);
        });
    });
}

// Рендер карточки дома
function createHouseCard(id, title, price) {
    const card = document.createElement('div');
    card.className = 'house-card';
    card.innerHTML = `
        <div>
            <h3>${escapeHtml(title)}</h3>
            <p class="house-price">${price} руб./сутки</p>
        </div>
        <button class="add-to-cart-btn" data-id="${id}" data-title="${escapeHtml(title)}" data-price="${price}">
            В корзину
        </button>
    `;
    
    card.querySelector('.add-to-cart-btn').addEventListener('click', (e) => {
        const btn = e.target;
        addToCart(btn.dataset.id, btn.dataset.title, Number(btn.dataset.price));
    });

    listingsGrid.appendChild(card);
}

// --- Корзина ---

function addToCart(id, title, price) {
    cart.push({ id, title, price });
    updateCartUI();
}

function updateCartUI() {
    cartList.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price;
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${escapeHtml(item.title)}</span>
            <span>${item.price} руб.</span>
        `;
        cartList.appendChild(li);
    });

    cartSum.textContent = total;
}

// Утилита для безопасности ввода
function escapeHtml(string) {
    return String(string).replace(/[&<>"']/g, function (s) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s];
    });
}
