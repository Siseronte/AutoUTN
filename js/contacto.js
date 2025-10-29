document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    const successMessage = document.getElementById('success-message');

    contactForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevenir el envío real del formulario

        const motivo = document.getElementById('motivo').value;
        const message = document.getElementById('message').value;
        let isValid = true;

        // Limpiar mensajes de éxito previos
        successMessage.style.display = 'none';

        // Validación de campos no vacíos
        if (!motivo || !message) {
            isValid = false;
            // Podríamos mostrar mensajes de error si quisiéramos
            alert('Por favor, completa todos los campos.');
        }

        if (isValid) {
            // Simular envío
            console.log('Formulario válido, enviando...');
            console.log({ motivo, message });

            // Mostrar mensaje de éxito
            successMessage.style.display = 'block';

            // Limpiar el formulario
            contactForm.reset();

            // Opcional: ocultar el mensaje después de unos segundos
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 5000);
        }
    });
});
