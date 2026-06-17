export * from "https://gstatic.com";
// ===== АВТОРИЗАЦИЯ =====
function login() {
    const email = $('loginEmail').value;
    const pass = $('loginPassword').value;

    if (!email || !pass) {
        alert('⚠️ Введите email и пароль');
        return;
    }

    auth.signInWithEmailAndPassword(email, pass)
        .then(() => {
            currentUser = auth.currentUser;
            showCatalog();
        })
        .catch(err => alert('❌ Ошибка: ' + err.message));
}

function register() {
    const name = $('registerName').value;
    const email = $('registerEmail').value;
    const pass = $('registerPassword').value;

    if (!name || !email || !pass) {
        alert('⚠️ Заполните все поля');
        return;
    }

    if (pass.length < 6) {
        alert('⚠️ Пароль должен быть не менее 6 символов');
        return;
    }

    auth.createUserWithEmailAndPassword(email, pass)
        .then((cred) => {
            return cred.user.updateProfile({ displayName: name });
        })
        .then(() => {
            currentUser = auth.currentUser;
            alert('✅ Регистрация успешна!');
            showCatalog();
        })
        .catch(err => alert('❌ Ошибка: ' + err.message));
}

function logout() {
    auth.signOut().then(() => {
        currentUser = null;
        cart = [];
        showLogin();
        updateCartBadge();
    });
}
