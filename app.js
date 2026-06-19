// Автоматическое переключение кнопок в шапке сайта
onAuthStateChanged(auth, (user) => {
    const btnLogin = document.getElementById('btnShowLogin');
    const btnRegister = document.getElementById('btnShowRegister');
    const btnLogout = document.getElementById('btnLogout');
    const userEmail = document.getElementById('userEmail');

    if (user) {
        // Если вошел: прячем Вход/Регистрацию, показываем Email и Выйти
        if(btnLogin) btnLogin.style.display = 'none';
        if(btnRegister) btnRegister.style.display = 'none';
        if(btnLogout) btnLogout.style.display = 'inline-block';
        if(userEmail) {
            userEmail.style.display = 'inline-block';
            userEmail.textContent = user.email;
        }
    } else {
        // Если вышел: показываем Вход/Регистрацию, прячем Выйти
        if(btnLogin) btnLogin.style.display = 'inline-block';
        if(btnRegister) btnRegister.style.display = 'inline-block';
        if(btnLogout) btnLogout.style.display = 'none';
        if(userEmail) userEmail.style.display = 'none';
    }
});

