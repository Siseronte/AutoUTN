document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const successMessage = document.getElementById('success-message');

    // Campos y errores
    const legajoInput = document.getElementById('legajo-registro');
    const legajoError = document.getElementById('legajo-error');
    const dniInput = document.getElementById('dni');
    const dniError = document.getElementById('dni-error');
    const emailInput = document.getElementById('email-registro');
    const emailError = document.getElementById('email-error');
    const passwordRegistroInput = document.getElementById('password-registro');
    const passwordError = document.getElementById('password-error');
    const passwordConfirmInput = document.getElementById('password-confirm');
    const passwordConfirmError = document.getElementById('password-confirm-error');
    const togglePasswordIcon = document.getElementById('togglePassword');
    const toggleConfirmPasswordIcon = document.getElementById('toggleConfirmPassword');

    // Función para validar campos numéricos en tiempo real
    const validateNumericInput = (input, maxLength) => {
        let value = input.value.replace(/\D/g, ''); // Eliminar no dígitos
        if (value.length > maxLength) {
            value = value.slice(0, maxLength);
        }
        input.value = value;
    };

    if(legajoInput) legajoInput.addEventListener('input', () => validateNumericInput(legajoInput, 5));
    if(dniInput) dniInput.addEventListener('input', () => validateNumericInput(dniInput, 8));

    // Función para alternar la visibilidad de la contraseña
    const togglePasswordVisibility = (inputElement, iconElement) => {
        const type = inputElement.getAttribute('type') === 'password' ? 'text' : 'password';
        inputElement.setAttribute('type', type);
        iconElement.classList.toggle('fa-eye');
        iconElement.classList.toggle('fa-eye-slash');
    };

    if (togglePasswordIcon && passwordRegistroInput) {
        togglePasswordIcon.addEventListener('click', () => togglePasswordVisibility(passwordRegistroInput, togglePasswordIcon));
    }

    if (toggleConfirmPasswordIcon && passwordConfirmInput) {
        toggleConfirmPasswordIcon.addEventListener('click', () => togglePasswordVisibility(passwordConfirmInput, toggleConfirmPasswordIcon));
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let isValid = true;

            // --- Validación Legajo ---
            if (legajoInput.value.length !== 5) {
                legajoError.textContent = 'El legajo debe tener 5 números.';
                legajoError.style.display = 'block';
                isValid = false;
            } else {
                legajoError.style.display = 'none';
            }

            // --- Validación DNI ---
            if (dniInput.value.length !== 8) {
                dniError.textContent = 'El DNI debe tener 8 números.';
                dniError.style.display = 'block';
                isValid = false;
            } else {
                dniError.style.display = 'none';
            }

            // --- Validación Email ---
            if (!emailInput.value.includes('@')) {
                emailError.textContent = 'Por favor, introduce un mail válido.';
                emailError.style.display = 'block';
                isValid = false;
            } else {
                emailError.style.display = 'none';
            }

            // --- Validación Contraseña (mínimo 6 caracteres) ---
            if (passwordRegistroInput.value.length < 6) {
                passwordError.textContent = 'La contraseña debe tener al menos 6 caracteres.';
                passwordError.style.display = 'block';
                isValid = false;
            } else {
                passwordError.style.display = 'none';
            }

            // --- Validación Repetir Contraseña (mínimo 6 caracteres y coincidencia) ---
            if (passwordConfirmInput.value.length < 6) {
                passwordConfirmError.textContent = 'La contraseña debe tener al menos 6 caracteres.';
                passwordConfirmError.style.display = 'block';
                isValid = false;
            } else if (passwordRegistroInput.value !== passwordConfirmInput.value) {
                passwordConfirmError.textContent = 'Las contraseñas no coinciden.';
                passwordConfirmError.style.display = 'block';
                isValid = false;
            } else {
                passwordConfirmError.style.display = 'none';
            }

            if (!isValid) {
                return; // Detiene el envío si algo es inválido
            }

            // Si toda la validación es exitosa
            console.log('Formulario de registro enviado');
            // Aquí iría la lógica para enviar los datos al backend

            // Mostrar mensaje de éxito
            registerForm.style.display = 'none';
            successMessage.style.display = 'block';
        });
    }

    // Ocultar mensajes de error mientras se escribe
    const inputs = [
        legajoInput,
        dniInput,
        emailInput,
        passwordRegistroInput,
        passwordConfirmInput
    ];
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                let errorElement;
                if (input.id === 'legajo-registro') errorElement = legajoError;
                else if (input.id === 'dni') errorElement = dniError;
                else if (input.id === 'email-registro') errorElement = emailError;
                else if (input.id === 'password-registro') errorElement = passwordError;
                else if (input.id === 'password-confirm') errorElement = passwordConfirmError;
                
                if (errorElement) {
                    errorElement.style.display = 'none'; // Siempre ocultar en input, la validación lo mostrará si es necesario
                }
            });
        }
    });
});
