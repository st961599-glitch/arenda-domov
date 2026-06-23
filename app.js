import { initializeApp } from "https://gstatic.com";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://gstatic.com";
import { getDatabase, ref, set, push, onValue } from "https://gstatic.com";

// Ваша конфигурация Firebase
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

// Элементы навигации и экранов
const authScreen = document.getElementById('auth-screen');
const appScreen = document.getElementById('app-screen');
const userDisplay = document.getElementById('user-display');
const logoutBtn = document.getElementById('logout-btn');
const navCartBtn = document.getElementById('nav-cart-btn');
const cartCount = document.getElementById('cart-count');

// Вкладки авторизации
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// Элементы контента
const listingForm = document.getElementById('listing-form');
const listingsGrid = document.getElementById('listings-grid');
const cartList = document.getElementById('cart-list');
const cartEmpty = document.getElementById('cart-empty');
const cartFooter = document.getElementById('cart-footer');
const cartSum = document.getElementById('cart-sum');
const checkoutBtn = document.getElementById('checkout-btn');

let currentUser = null;
let cart = [];

/* --- 1. ПЕРЕКЛЮЧЕНИЕ ИНТЕРФЕЙСА (Вкладки Вход / Регистрация) --- */
tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
});

tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
});

/* --- 2. ЛОГИКА АВТОРИЗАЦИИ (FIREBASE AUTH) --- */

// Регистрация
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        showToast("✅ Аккаунт успешно создан!");
        registerForm.reset();
    } catch (error) {
        showToast("❌ Ошибка регистрации: " + error.message);
    }
});

// Вход
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showToast("👋 Рады видеть вас снова!");
        loginForm.reset();
    } catch (error) {
        showToast("❌ Неверный логин или пароль");
    }
});

// Выход
logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => showToast("ℹ️ Вы вышли из аккаунта"));
});

// Отслеживание сессии (Показывает нужный экран сайта)
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        userDisplay.textContent = user.email;
        
        // Показываем приложение, прячем авторизацию
        authScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        navCartBtn.classList.remove('hidden');
        
        listenToListings(); // Включаем живую базу данных
    } else {
        currentUser = null;
        userDisplay.textContent = '';
        
        // Возвращаем экран авторизации
        authScreen.classList.remove('hidden');
        appScreen.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        navCartBtn.classList.add('hidden');
        
        listingsGrid.innerHTML = '';
        cart = [];
        updateCartUI();
    }
});

/* --- 3. РАБОТА С ОБЪЯВЛЕНИЯМИ (FIREBASE REALTIME DATABASE) --- */

// Добавление дома
listingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const title = document.getElementById('house-title').value;
    const price = Number(document.getElementById('house-price').value);

    try {
        const listingsRef = ref(database, 'listings');
        const newHouseRef = push(listingsRef);
        await set(newHouseRef, {
            title: title,
            price: price,
            owner: currentUser.uid
        });
        showToast("🎉 Объявление успешно опубликовано!");
        listingForm.reset();
    } catch (error) {
        showToast("❌ Ошибка публикации: " + error.message);
    }
});

// Получение данных и построение живого каталога
function listenToListings() {
    const listingsRef = ref(database, 'listings');
    onValue(listingsRef, (snapshot) => {
        listingsGrid.innerHTML = '';
        const data = snapshot.val();
        
        if (!data) {
            listingsGrid.innerHTML = '<div class="empty-message">Объявлений пока нет. Станьте первым!</div>';
            return;
        }

        Object.keys(data).forEach((id) => {
            const item = data[id];
            renderHouseCard(id, item.title, item.price);
        });
    });
}

// Отрисовка красивой карточки
function renderHouseCard(id, title, price) {
    const card = document.createElement('div');
    card.className = 'house-card';
    card.innerHTML = `
        <div>
            <h4>${escapeHtml(title)}</h4>
            <div class="house-price">${price.toLocaleString()} ₽ <small>/ сутки</small></div>
        </div>
        <button class="btn btn-primary add-to-cart-btn" data-id="${id}" data-title="${escapeHtml(title)}" data-price="${price}">
            Забронировать
        </button>
    `;

    card.querySelector('.add-to-cart-btn').addEventListener('click', (e) => {
        const btn = e.target;
        addToCart(btn.dataset.id, btn.dataset.title, Number(btn.dataset.price));
    });

    listingsGrid.appendChild(card);
}

/* --- 4. РАБОТА С КОРЗИНОЙ --- */

function addToCart(id, title, price) {
    cart.push({ cartItemId: Date.now(), id, title, price });
    showToast(`🛒 ${title} добавлен в корзину`);
    updateCartUI();
}

function removeFromCart(cartItemId) {
    cart = cart.filter(item => item.cartItemId !== cartItemId);
    updateCartUI();
}

function updateCartUI() {
    cartList.innerHTML = '';
    
    if (cart.length === 0) {
        cartEmpty.classList.remove('hidden');
        cartFooter.classList.add('hidden');
        cartCount.textContent = '0';
        return;
    }

    cartEmpty.classList.add('hidden');
    cartFooter.classList.remove('hidden');
    cartCount.textContent = cart.length;

    let total = 0;
    cart.forEach((item) => {
        total += item.price;
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <div><strong>${escapeHtml(item.title)}</strong></div>
                <div style="font-size:0.85rem; color:var(--text-muted)">${item.price.toLocaleString()} ₽</div>
            </div>
            <button class="remove-cart-item" data-cart-id="${item.cartItemId}">✕</button>
        `;
        
        li.querySelector('.remove-cart-item').addEventListener('click', (e) => {
            removeFromCart(Number(e.target.dataset.cartId));
        });

        cartList.appendChild(li);
    });

    cartSum.textContent = total.toLocaleString();
}

checkoutBtn.addEventListener('click', () => {
    showToast("🚀 Успешно! Ваша заявка на аренду отправлена владельцам.");
    cart = [];
    updateCartUI();
});

/* --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ --- */

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3500);
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
