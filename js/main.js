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
        staticLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (legajoStaticInput.value.length !== 5) {
                alert('El legajo debe tener exactamente 5 números.');
                return;
            }

            alert('Formulario estático enviado. Iniciando sesión...');
            // Aquí iría la lógica para enviar los datos al backend
        });
    }
});
