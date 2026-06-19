const firebaseConfig = {
  apiKey: "AIzaSyDm3XvtldDnpLDH29uV8e0722nWj08vNqA",
  authDomain: "arenda-domov-e2e15.firebaseapp.com",
  projectId: "arenda-domov-e2e15",
  storageBucket: "arenda-domov-e2e15.firebasestorage.app",
  messagingSenderId: "297684238985",
  appId: "1:297684238985:web:727fd972cdc8465a55fc58",
  measurementId: "G-6GZ904F8D1"
};
  
// Initialize Firebase
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js"></script>

// Регистрация
function register() {
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const name = document.getElementById('registerName').value;
    auth.createUserWithEmailAndPassword(email, password)
        .then(credential => {
            return credential.user.updateProfile({ displayName: name });
        })
        .then(() => {
            alert('Регистрация прошла успешно!');
            showPage('catalogPage');
            loadProducts();
        })
        .catch(error => alert('Ошибка: ' + error.message));
}

// Вход
function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            alert('Добро пожаловать!');
            showPage('catalogPage');
            loadProducts();
        })
        .catch(error => alert('Ошибка: ' + error.message));
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
