document.addEventListener('DOMContentLoaded', () => {
    // Lógica para el menú hamburguesa
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('.nav');

    if (hamburger && nav) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            nav.classList.toggle('active');
        });
    }

    // Función para validar campos numéricos en tiempo real
    const validateNumericInput = (input, maxLength) => {
        let value = input.value.replace(/\D/g, ''); // Eliminar no dígitos
        if (value.length > maxLength) {
            value = value.slice(0, maxLength);
        }
        input.value = value;
    };

    // --- Lógica para el formulario estático de login en index.html ---
    const staticLoginForm = document.getElementById('static-login-form');
    const legajoStaticInput = document.getElementById('legajo-static');

    // Aplicar validación numérica en tiempo real al campo de legajo estático
    if (legajoStaticInput) {
        legajoStaticInput.addEventListener('input', () => validateNumericInput(legajoStaticInput, 5));
    }

    // Validar al enviar el formulario estático
    if (staticLoginForm) {
        staticLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const legajo = legajoStaticInput.value;
            const password = document.getElementById('password-static').value;

            // Validaciones
            if (legajo.length !== 5) {
                showMessage('El legajo debe tener exactamente 5 números.', 'error');
                return;
            }

            if (!password) {
                showMessage('La contraseña es obligatoria.', 'error');
                return;
            }

            // Mostrar loading
            showMessage('Iniciando sesión...', 'info');
            
            // Realizar login
            const result = await authManager.login(legajo, password);
            
            if (result.success) {
                showMessage('¡Login exitoso! Redirigiendo...', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                showMessage(result.message, 'error');
            }
        });
    }

    // Función para mostrar mensajes al usuario
    function showMessage(message, type) {
        // Remover mensaje anterior si existe
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Crear nuevo mensaje
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        // Insertar antes del formulario
        const form = document.getElementById('static-login-form');
        if (form) {
            form.parentNode.insertBefore(messageDiv, form);
            
            // Auto-remover después de 5 segundos
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
        }
    }
});
