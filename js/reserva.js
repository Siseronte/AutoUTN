document.addEventListener('DOMContentLoaded', () => {
    // Asumimos que tienes estos elementos en tu reserva.html
    const fechaInput = document.getElementById('fecha-reserva');
    const horaInput = document.getElementById('hora-reserva');
    const btnVerificar = document.getElementById('btn-verificar');
    const btnReservar = document.getElementById('btn-reservar');
    const mensajeDisponibilidad = document.getElementById('mensaje-disponibilidad');

    // Deshabilitar el botón de reservar por defecto
    btnReservar.disabled = true;

    // Función para verificar la disponibilidad
    const verificarDisponibilidad = async () => {
        const fecha = fechaInput.value;
        const hora = horaInput.value;

        if (!fecha || !hora) {
            mensajeDisponibilidad.textContent = 'Por favor, selecciona una fecha y hora.';
            mensajeDisponibilidad.className = 'message message-info';
            btnReservar.disabled = true;
            return;
        }

        // Combinamos fecha y hora en el formato que espera el backend (YYYY-MM-DDTHH:MM:SS)
        const fechaHoraCompleta = `${fecha}T${hora}:00`;
        mensajeDisponibilidad.textContent = 'Verificando...';
        mensajeDisponibilidad.className = 'message message-info';

        try {
            const response = await fetch(`http://localhost:3000/api/disponibilidad?fecha=${fechaHoraCompleta}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al verificar.');
            }

            if (data.disponibles > 0) {
                mensajeDisponibilidad.textContent = `¡Hay ${data.disponibles} lugares disponibles! Puedes reservar.`;
                mensajeDisponibilidad.className = 'message message-success';
                btnReservar.disabled = false; // Habilitar el botón
            } else {
                mensajeDisponibilidad.textContent = 'No hay lugares disponibles para la fecha y hora seleccionadas.';
                mensajeDisponibilidad.className = 'message message-error';
                btnReservar.disabled = true; // Mantener deshabilitado
            }

        } catch (error) {
            mensajeDisponibilidad.textContent = error.message;
            mensajeDisponibilidad.className = 'message message-error';
            btnReservar.disabled = true;
        }
    };

    // Función para realizar la reserva
    const realizarReserva = async () => {
        const userData = authManager.getUserData();
        if (!userData) {
            alert('Debes iniciar sesión para poder reservar.');
            window.location.href = 'index.html';
            return;
        }

        // Asumimos que el usuario tiene un vehículo y lo seleccionó.
        // Para este ejemplo, usaremos una patente fija. En el futuro, aquí iría un selector.
        const patenteVehiculo = 'ABC123'; // TODO: Reemplazar con un selector de vehículos del usuario.
        const fechaHoraCompleta = `${fechaInput.value}T${horaInput.value}:00`;

        try {
            const response = await fetch('http://localhost:3000/api/reservas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ legajo: userData.legajo, patente: patenteVehiculo, fecha: fechaHoraCompleta })
            });
            const data = await response.json();

            alert(data.message); // Mostrar mensaje de éxito o error
            if (response.ok) {
                window.location.href = 'dashboard.html'; // Redirigir al dashboard
            }
        } catch (error) {
            alert('Error de conexión al intentar reservar.');
        }
    };

    // Añadir los listeners a los botones
    btnVerificar.addEventListener('click', verificarDisponibilidad);
    btnReservar.addEventListener('click', realizarReserva);
});