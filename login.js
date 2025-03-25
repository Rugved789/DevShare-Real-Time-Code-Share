document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-btn');
    const loginModal = document.getElementById('login-modal');
    const closeBtn = document.getElementById('close-btn');
    const signInTab = document.getElementById('sign-in-tab');
    const signUpTab = document.getElementById('sign-up-tab');
    const loginForm = document.getElementById('login-form');

    loginButton.addEventListener('click', () => {
        loginModal.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
        }
    });

    signInTab.addEventListener('click', () => {
        signInTab.classList.add('active');
        signUpTab.classList.remove('active');
        loginForm.style.display = 'block';
    });

    signUpTab.addEventListener('click', () => {
        signUpTab.classList.add('active');
        signInTab.classList.remove('active');
        loginForm.style.display = 'none';
        // Add sign-up form logic here
    });
});
