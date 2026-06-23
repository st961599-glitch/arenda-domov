// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBe5isqAXiHofhuO7b4RzGwRjfINwdN93k",
  authDomain: "://firebaseapp.com",
  projectId: "sigma123459590",
  storageBucket: "sigma123459590.firebasestorage.app",
  messagingSenderId: "644288652683",
  appId: "1:644288652683:web:a87718799e62a9a12e7b8e",
  measurementId: "G-Y6NZ9E83VJ"
};
  
// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// МАССИВ ДЛЯ КОРЗИНЫ
let cartItems = [];

// Вспомогательная функция: показывать нужную страницу
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.style.display = 'block';
    }
}

// Слушатель состояния авторизации
auth.onAuthStateChanged(user => {
    if (user) {
        showPage('catalogPage');
        loadProducts();
    } else {
        showPage('loginPage');
    }
});

// Регистрация
function register() {
    const emailInput = document.getElementById('registerEmail');
    const passwordInput = document.getElementById('registerPassword');
    const nameInput = document.getElementById('registerName');

    if (!emailInput || !passwordInput || !nameInput) {
        alert('Ошибка: элементы формы не найдены в HTML');
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const name = nameInput.value.trim();

    if (!email || !password) {
        alert('Пожалуйста, введите Email и Пароль');
        return;
    }

    if (password.length < 6) {
        alert('Пароль должен быть не менее 6 символов');
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then(credential => {
            if (name) {
                return credential.user.updateProfile({ displayName: name });
            }
        })
        .then(() => {
            alert('Регистрация прошла успешно!');
        })
        .catch(error => {
            alert('Ошибка регистрации: ' + error.message);
        });
}

// Вход
function login() {
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');

    if (!emailInput || !passwordInput) {
        alert('Ошибка: элементы формы входа не найдены');
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        alert('Введите Email и Пароль для входа');
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            alert('Добро пожаловать!');
        })
        .catch(error => {
            alert('Ошибка входа: ' + error.message);
        });
}

// Выйти
function logout() {
    auth.signOut()
        .then(() => {
            cartItems = [];
            updateCartUI();
        })
        .catch(error => alert('Ошибка при выходе: ' + error.message));
}

// Загрузка товаров
function loadProducts() {
    const container = document.getElementById('products');
    if (!container) return;
    container.innerHTML = '';

    db.collection('products').get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const product = doc.data();
                const div = document.createElement('div');
                div.className = 'product';

                const description = product.description || "Описание отсутствует.";

                div.innerHTML = `
                    <h4>${product.name}</h4>
                    <div class="product-image-container">
                        <img src="${product.imageUrl}" alt="${product.name}"/>
                        <div class="product-description">${description}</div>
                    </div>
                    <p>Цена: ${product.price} руб.</p>
                `;

                const buyBtn = document.createElement('button');
                buyBtn.innerText = 'Купить';
                buyBtn.style.backgroundColor = '#2ed573';
                buyBtn.style.color = 'white';
                buyBtn.onclick = () => {
                    addToCart(doc.id, product.name, product.price);
                };
                div.appendChild(buyBtn);

                container.appendChild(div);
            });
        })
        .catch(error => alert('Ошибка загрузки товаров: ' + error.message));
}

function showLogin() {
    showPage('loginPage');
}
function showRegister() {
    showPage('registerPage');
}

/* ФУНКЦИИ КОРЗИНЫ */
function toggleCartView() {
    const cartSection = document.getElementById('cartSection');
    if (!cartSection) return;
    if (cartSection.style.display === 'none' || cartSection.style.display === '') {
        cartSection.style.display = 'block';
    } else {
        cartSection.style.display = 'none';
    }
}

function addToCart(id, name, price) {
    const existing = cartItems.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cartItems.push({ id: id, name: name, price: price, quantity: 1 });
    }
    updateCartUI();
}

function removeFromCart(id) {
    cartItems = cartItems.filter(item => item.id !== id);
    updateCartUI();
}

function updateCartUI() {
    const itemsContainer = document.getElementById('cartItems');
    const countSpan = document.getElementById('cartCount');
    const totalSpan = document.getElementById('cartTotal');
    
    if (!itemsContainer || !countSpan || !totalSpan) return;
    
    itemsContainer.innerHTML = '';
    let totalCount = 0;
    let totalPrice = 0;

    cartItems.forEach(item => {
        totalCount += item.quantity;
        totalPrice += item.price * item.quantity;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <span>${item.name} (x${item.quantity}) — ${item.price * item.quantity} руб.</span>
            <button onclick="removeFromCart('${item.id}')" style="background: red; color: white; border: none; padding: 2px 5px; margin-left: 10px; cursor: pointer;">×</button>
        `;
        itemsContainer.appendChild(div);
    });

    countSpan.innerText = totalCount;
    totalSpan.innerText = totalPrice;
}

/* ФУНКЦИИ МОДАЛЬНОГО ОКНА И ОФОРМЛЕНИЯ ЗАКАЗА */
function openOrderModal() {
    if (cartItems.length === 0) {
        alert('Корзина пуста!');
        return;
    }
    const modal = document.getElementById('orderModal');
    if (modal) {
        modal.style.display = 'flex';
        
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.displayName) {
            const nameInput = document.getElementById('orderName');
            if (nameInput) nameInput.value = currentUser.displayName;
        }
    }
}

function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    if (modal) modal.style.display = 'none';
    
    if (document.getElementById('orderName')) document.getElementById('orderName').value = '';
    if (document.getElementById('orderPhone')) document.getElementById('orderPhone').value = '';
    if (document.getElementById('orderCard')) document.getElementById('orderCard').value = '';
}

function submitOrder() {
    const name = document.getElementById('orderName').value.trim();
    const phone = document.getElementById('orderPhone').value.trim();
    const card = document.getElementById('orderCard').value.trim();

    if (!name || !phone || !card) {
        alert('Пожалуйста, заполните все поля: Имя, Телефон и Номер карты');
        return;
    }

    let totalPrice = 0;
    cartItems.forEach(item => {
        totalPrice += item.price * item.quantity;
    });

    const currentUser = auth.currentUser;
    const userId = currentUser ? currentUser.uid : 'anonymous';
    const userEmail = currentUser ? currentUser.email : 'unknown';

    const orderData = {
        customerName: name,
        customerPhone: phone,
        customerCard: card,
        userId: userId,
        userEmail: userEmail,
        items: cartItems,
        totalAmount: totalPrice,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection('orders').add(orderData)
        .then(() => {
            alert('Заказ успешно оплачен и оформлен!');
            cartItems = [];
            updateCartUI();
            
            const cartSection = document.getElementById('cartSection');
            if (cartSection) cartSection.style.display = 'none';
            closeOrderModal();
        })
        .catch(error => {
            alert('Ошибка при оформлении заказа: ' + error.message);
        });
}

