// pageProtection.js - Protección de páginas que requieren autenticación
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si el usuario está autenticado
    if (!authManager.checkAuth()) {
        // Si no está autenticado, redirigir al login
        window.location.href = 'index.html';
        return;
    }
});