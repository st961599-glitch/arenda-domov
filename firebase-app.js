export * from "https://gstatic.com";
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
