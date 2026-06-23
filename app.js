// ОБЯЗАТЕЛЬНО: Вставьте сюда свои данные из Firebase Console!
const firebaseConfig = {
  apiKey: "AIzaSyDm3XvtldDnpLDH29uV8e0722nWj08vNqA",
  authDomain: "arenda-domov-e2e15.firebaseapp.com",
  projectId: "arenda-domov-e2e15",
  storageBucket: "arenda-domov-e2e15.firebasestorage.app",
  messagingSenderId: "297684238985",
  appId: "1:297684238985:web:727fd972cdc8465a55fc58",
  measurementId: "G-6GZ904F8D1"
};


// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// DOM Элементы
const authSection = document.getElementById('auth-section');
const mainContent = document.getElementById('main-content');
const emailInput = document.getElementById('auth-email');
const passwordInput = document.getElementById('auth-password');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');

const houseTitleInput = document.getElementById('house-title');
const housePriceInput = document.getElementById('house-price');
const addListingBtn = document.getElementById('add-listing-btn');
const listingsContainer = document.getElementById('listings-container');

const cartList = document.getElementById('cart-list');
const cartTotalSum = document.getElementById('cart-total-sum');

// Глобальное состояние приложения
let currentUser = null;
let cart = [];

/* ==========================================
   1. ЛОГИКА АВТОРИЗАЦИИ (ВХОД / РЕГИСТРАЦИЯ)
   ========================================== */

// Кнопка: Регистрация
registerBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if(!email || !password) return alert('Заполните email и пароль!');

    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            alert('Регистрация успешна! Вы вошли на сайт.');
            emailInput.value = '';
            passwordInput.value = '';
        })
        .catch((error) => {
            alert('Ошибка регистрации: ' + error.message);
        });
});

// Кнопка: Войти
loginBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    if(!email || !password) return alert('Заполните email и пароль!');

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            alert('Вы успешно вошли на сайт!');
            emailInput.value = '';
            passwordInput.value = '';
        })
        .catch((error) => {
            alert('Ошибка входа: ' + error.message);
        });
});

// Кнопка: Выйти
logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// Настоящее отслеживание сессии пользователя в реальном времени
auth.onAuthStateChanged((user) => {
    if (user) {
        // Пользователь ВОШЕЛ
        currentUser = user;
        userInfo.textContent = "Вы вошли как: " + user.email;
        
        authSection.classList.add('hidden');    // Прячем форму входа
        mainContent.classList.remove('hidden'); // Показываем внутренности сайта
        logoutBtn.classList.remove('hidden');   // Показываем кнопку Выйти
        
        loadListingsFromFirebase();             // Запускаем синхронизацию каталога с БД
    } else {
        // Пользователь ВЫШЕЛ
        currentUser = null;
        userInfo.textContent = "Гость";
        
        authSection.classList.remove('hidden'); // Показываем форму входа
        mainContent.classList.add('hidden');    // Прячем сайт
        logoutBtn.classList.add('hidden');      // Прячем кнопку Выйти
        
        listingsContainer.innerHTML = '';
        cart = [];
        updateCartUI();
    }
});


/* ==========================================
   2. ДОБАВЛЕНИЕ ОБЪЯВЛЕНИЙ В FIREBASE DATABASE
   ========================================== */

addListingBtn.addEventListener('click', () => {
    const title = houseTitleInput.value;
    const price = Number(housePriceInput.value);

    if (!title || !price) {
        return alert('Заполните название дома и цену!');
    }

    // Создаем запись в ветке 'listings' базы данных
    const listingsRef = database.ref('listings');
    const newHouseRef = listingsRef.push(); // Генерирует уникальный ID объявления
    
    newHouseRef.set({
        title: title,
        price: price,
        userId: currentUser.uid
    })
    .then(() => {
        alert('Объявление добавлено в базу данных!');
        houseTitleInput.value = '';
        housePriceInput.value = '';
    })
    .catch((error) => {
        alert('Ошибка записи в БД: ' + error.message);
    });
});


/* ==========================================
   3. ВЫВОД КАТАЛОГА В РЕАЛЬНОМ ВРЕМЕНИ
   ========================================== */

function loadListingsFromFirebase() {
    const listingsRef = database.ref('listings');
    
    // on('value') автоматически обновляет экран, если кто-то добавил новый дом
    listingsRef.on('value', (snapshot) => {
        listingsContainer.innerHTML = '';
        const data = snapshot.val();
        
        if (!data) {
            listingsContainer.innerHTML = '<p>Объявлений пока нет.</p>';
            return;
        }

        // Проходим циклом по всем объявлениям в базе
        Object.keys(data).forEach((id) => {
            const house = data[id];
            
            // Создаем HTML карточки
            const card = document.createElement('div');
            card.className = 'house-card';
            card.innerHTML = `
                <div>
                    <h3>${house.title}</h3>
                    <div class="price">${house.price} руб./сут.</div>
                </div>
                <button class="btn btn-primary buy-btn" data-title="${house.title}" data-price="${house.price}">
                    Добавить в корзину
                </button>
            `;

            // Вешаем событие клика на кнопку «Добавить в корзину»
            card.querySelector('.buy-btn').addEventListener('click', (e) => {
                const title = e.target.getAttribute('data-title');
                const price = Number(e.target.getAttribute('data-price'));
                addToCart(title, price);
            });

            listingsContainer.appendChild(card);
        });
    });
}


/* ==========================================
   4. РАБОТА НАСТОЯЩЕЙ КОРЗИНЫ
   ========================================== */

function addToCart(title, price) {
    // Добавляем объект в массив корзины
    cart.push({
        cartId: Date.now(), // Уникальный ID для удаления
        title: title,
        price: price
    });
    updateCartUI();
}

function removeFromCart(cartId) {
    // Удаляем конкретный элемент по его ID
    cart = cart.filter(item => item.cartId !== cartId);
    updateCartUI();
}

function updateCartUI() {
    cartList.innerHTML = '';
    let total = 0;

    cart.forEach((item) => {
        total += item.price;

        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item.title} (${item.price} руб.)</span>
            <button class="btn btn-danger delete-btn" data-cart-id="${item.cartId}">Удалить</button>
        `;

        // Слушатель для кнопки удаления из корзины
        li.querySelector('.delete-btn').addEventListener('click', (e) => {
            const idToRemove = Number(e.target.getAttribute('data-cart-id'));
            removeFromCart(idToRemove);
        });

        cartList.appendChild(li);
    });

    // Обновляем итоговую сумму
    cartTotalSum.textContent = total;
}
