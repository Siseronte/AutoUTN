document.addEventListener('DOMContentLoaded', () => {
    const authButtonsContainer = document.querySelector('.auth-buttons');
    const navMenu = document.querySelector('.nav-menu');

    // Esta función se ejecutará en cada página que incluya este script.
    const actualizarUI = () => {
        if (authManager.isAuthenticated()) {
            // --- El usuario ESTÁ logueado ---
            const userData = authManager.getUserData();

            // 1. Actualizar el header para mostrar el nombre y el botón de logout
            if (authButtonsContainer) {
                authButtonsContainer.innerHTML = `
                    <span class="user-name">${userData.nombre} ${userData.apellido}</span>
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
            const inicioLink = navMenu.querySelector('a[href="index.html"]');
            if (inicioLink) {
                inicioLink.href = 'dashboard.html';
            }

            // 3. Si estamos en el dashboard, rellenar la información del usuario
            if (window.location.pathname.endsWith('dashboard.html')) {
                // Usamos querySelectorAll para actualizar todos los elementos con la clase .user-name
                document.querySelectorAll('.user-name').forEach(el => el.textContent = `${userData.nombre} ${userData.apellido}`);
                document.querySelectorAll('.user-legajo').forEach(el => el.textContent = userData.legajo);
                document.querySelectorAll('.user-email').forEach(el => el.textContent = userData.email);
                document.querySelectorAll('.user-tokens').forEach(el => el.textContent = userData.tokens);
            }

        } else {
            // --- El usuario NO ESTÁ logueado ---
            // Nos aseguramos de que el header muestre el botón de registrarse.
            // (Esto ya está por defecto en el HTML, pero es una buena práctica confirmarlo).
        }
    };

    // Ejecutar la función para actualizar la UI tan pronto como la página cargue.
    actualizarUI();
});