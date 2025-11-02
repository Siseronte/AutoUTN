// c:/Users/User/Desktop/Proyecto Final Integrador/js/auth.js

class AuthManager {
    constructor() {
        this.userData = JSON.parse(localStorage.getItem('userData'));
        this.baseURL = 'http://localhost:3000/api'; // Apunta a nuestro nuevo backend
    }

    // Guardar datos del usuario en localStorage
    setUserData(userData) {
        this.userData = userData;
        localStorage.setItem('userData', JSON.stringify(userData));
    }

    // Obtener datos del usuario
    getUserData() {
        return this.userData || JSON.parse(localStorage.getItem('userData'));
    }

    // Eliminar datos del usuario (logout)
    removeUserData() {
        this.userData = null;
        localStorage.removeItem('userData');
    }

    // Verificar si el usuario está "logueado" (si hay datos guardados)
    isAuthenticated() {
        return !!this.getUserData();
    }

    // Realizar login
    async login(legajo, password) {
        try {
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ legajo, password })
            });

            const data = await response.json();

            if (response.ok) { // response.ok es true para status 200-299
                this.setUserData(data.user);
                return { success: true, message: data.message };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            return { success: false, message: 'Error de conexión con el servidor.' };
        }
    }

    // Realizar logout
    logout() {
        this.removeUserData();
        window.location.href = 'index.html';
    }

    // Verificar autenticación y redirigir si es necesario
    checkAuth() {
        if (!this.isAuthenticated()) {
            // No redirige automáticamente, solo devuelve el estado.
            // La redirección la hará pageProtection.js
            return false;
        }
        return true;
    }
}

// Crear instancia global
const authManager = new AuthManager();
