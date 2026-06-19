const firebaseConfig = {
  apiKey: "AIzaSyDm3XvtldDnpLDH29uV8e0722nWj08vNqA",
  authDomain: "arenda-domov-e2e15.firebaseapp.com",
  projectId: "arenda-domov-e2e15",
  storageBucket: "arenda-domov-e2e15.firebasestorage.app",
  messagingSenderId: "297684238985",
  appId: "1:297684238985:web:727fd972cdc8465a55fc58",
  measurementId: "G-6GZ904F8D1"
};
  
// Регистрация
function register() {
    const emailInput = document.getElementById('registerEmail');
    const passwordInput = document.getElementById('registerPassword');
    const nameInput = document.getElementById('registerName');

    if (!emailInput || !passwordInput || !nameInput) {
        alert('Ошибка: Не удалось найти поля ввода на странице!');
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const name = nameInput.value.trim();

    if (!email || !password || !name) {
        alert('Пожалуйста, заполните все поля для регистрации!');
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then(credential => {
            return credential.user.updateProfile({ displayName: name });
        })
        .then(() => {
            alert('Регистрация прошла успешно!');
            showPage('catalogPage');
            switchTab('productsTab');
            loadProducts();
        })
        .catch(error => alert('Ошибка регистрации: ' + error.message));
}

// Вход
function login() {
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');

    if (!emailInput || !passwordInput) {
        alert('Ошибка: Не удалось найти поля ввода для входа!');
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        alert('Пожалуйста, введите Email и Пароль!');
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            alert('Добро пожаловать!');
            showPage('catalogPage');
            switchTab('productsTab');
            loadProducts();
        })
        .catch(error => alert('Ошибка входа: ' + error.message));
}

// Выйти
function logout() {
    auth.signOut();
}
 function showLogin() {
    showPage('loginPage');
}
function showRegister() {
    showPage('registerPage');
}
