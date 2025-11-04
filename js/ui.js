// Hacemos la función global para poder llamarla desde otros scripts
function actualizarUI() {
    const authButtonsContainer = document.querySelector('.auth-buttons');
    const navMenu = document.querySelector('.nav-menu');

    if (authManager.isAuthenticated()) {
        // --- El usuario ESTÁ logueado ---
        const userData = authManager.getUserData();

        // 1. Actualizar el header para mostrar el nombre y el botón de logout
        if (authButtonsContainer) {
            authButtonsContainer.innerHTML = `
                <span class="user-name">${userData.nombre} ${userData.apellido}</span>
                <span class="user-tokens-header">Tokens: ${userData.tokens}</span>
                <button class="btn-login logout-btn">Cerrar Sesión</button>
            `;

            // Añadir el evento al nuevo botón de logout
            const logoutBtn = authButtonsContainer.querySelector('.logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                        authManager.logout();
                    }
                });
            }
        }

        // 2. Cambiar el enlace de "Inicio" para que apunte al Dashboard
        if (navMenu) {
            const inicioLink = navMenu.querySelector('a[href="index.html"]');
            if (inicioLink) {
                inicioLink.href = 'dashboard.html';
            }
        }

        // 3. Si estamos en el dashboard, rellenar la información del usuario
        if (window.location.pathname.endsWith('dashboard.html')) {
            document.querySelectorAll('.user-name').forEach(el => el.textContent = `${userData.nombre} ${userData.apellido}`);
            document.querySelectorAll('.user-legajo').forEach(el => el.textContent = userData.legajo);
            document.querySelectorAll('.user-email').forEach(el => el.textContent = userData.email);
            document.querySelectorAll('.user-tokens').forEach(el => el.textContent = userData.tokens);
        }

    } else {
        // --- El usuario NO ESTÁ logueado ---
        // El HTML por defecto ya tiene los botones de "Registrarse", así que no es necesario hacer nada.
    }
}