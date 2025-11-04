document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    const successMessage = document.getElementById('success-message');

    contactForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // Prevenir el envío real del formulario

        const emailInput = document.getElementById('email-contacto');
        const messageInput = document.getElementById('message');
        const submitButton = contactForm.querySelector('.btn-submit');

        const formData = {
            email: emailInput.value,
            mensaje: messageInput.value
        };

        if (!formData.email || !formData.mensaje) {
            alert('Por favor, completa todos los campos.');
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';
        successMessage.style.display = 'none';

        try {
            const response = await fetch('http://localhost:3000/api/contacto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();

            if (response.ok) {
                successMessage.textContent = data.message;
                successMessage.style.display = 'block';
                contactForm.reset();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar';
        }
    });
});
