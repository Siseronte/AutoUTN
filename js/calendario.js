document.addEventListener('DOMContentLoaded', () => {
    const monthElement = document.querySelector('.current-month');
    const prevMonthButton = document.querySelector('.prev-month');
    const nextMonthButton = document.querySelector('.next-month');
    const calendarGrid = document.querySelector('.calendar-grid');
    const bookingFormContainer = document.getElementById('booking-form-container');
    const bookingForm = document.getElementById('booking-form');
    const timeRangeInputs = document.querySelectorAll('input[name="rango-horario"]');
    const selectorVehiculo = document.getElementById('selector-vehiculo');
    const listaMisReservas = document.getElementById('lista-mis-reservas');

    let currentDate = new Date();
    currentDate.setDate(1);
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let selectedDate = null;
    let selectedDateObj = null;

    const today = new Date();

    // --- FUNCIÓN PARA CARGAR LOS VEHÍCULOS DEL USUARIO ---
    const cargarVehiculosUsuario = async () => {
        const userData = authManager.getUserData();
        if (!userData) return;

        try {
            const response = await fetch(`http://localhost:3000/api/vehiculos?legajo=${userData.legajo}`);
            if (!response.ok) throw new Error('No se pudieron cargar tus vehículos.');
            
            const vehiculos = await response.json();
            selectorVehiculo.innerHTML = ''; // Limpiar opciones

            if (vehiculos.length === 0) {
                selectorVehiculo.innerHTML = '<option value="">No tienes vehículos registrados</option>';
                selectorVehiculo.disabled = true;
            } else {
                selectorVehiculo.disabled = false;
                vehiculos.forEach(v => {
                    const option = document.createElement('option');
                    option.value = v.patente;
                    option.textContent = `${v.marca} ${v.modelo} (${v.patente})`;
                    selectorVehiculo.appendChild(option);
                });
            }
        } catch (error) {
            console.error(error);
            selectorVehiculo.innerHTML = `<option value="">${error.message}</option>`;
            selectorVehiculo.disabled = true;
        }
    };

    // --- FUNCIÓN PARA CARGAR Y MOSTRAR LAS RESERVAS DEL USUARIO ---
    const cargarReservasUsuario = async () => {
        const userData = authManager.getUserData();
        if (!userData) return;

        try {
            const response = await fetch(`http://localhost:3000/api/reservas?legajo=${userData.legajo}`);
            if (!response.ok) throw new Error('No se pudieron cargar tus reservas.');

            const reservas = await response.json();
            listaMisReservas.innerHTML = ''; // Limpiar lista

            if (reservas.length === 0) {
                listaMisReservas.innerHTML = '<li>No tienes reservas activas o pasadas.</li>';
            } else {
                const turnos = { 1: 'Mañana', 2: 'Tarde', 3: 'Noche' };
                reservas.forEach(r => {
                    const li = document.createElement('li');
                    const fecha = new Date(r.fecha_entrada).toLocaleDateString('es-AR');
                    li.className = `reserva-item estado-${r.estado}`;
                    li.innerHTML = `
                        <div class="reserva-info">
                            <span><strong>Fecha:</strong> ${fecha}</span>
                            <span><strong>Turno:</strong> ${turnos[r.horario]}</span>
                            <span><strong>Patente:</strong> ${r.patente_vehiculo}</span>
                        </div>
                        <div class="reserva-estado">
                            <span>${r.estado.charAt(0).toUpperCase() + r.estado.slice(1)}</span>
                        </div>
                    `;
                    listaMisReservas.appendChild(li);
                });
            }
        } catch (error) {
            console.error(error);
            listaMisReservas.innerHTML = `<li>${error.message}</li>`;
        }
    };

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    function updateHorarios(selectedDayDate) {
        const now = new Date();
        const currentHour = now.getHours();

        // Desmarcar cualquier selección previa
        timeRangeInputs.forEach(input => {
            input.checked = false;
            input.disabled = false;
            input.parentElement.classList.remove('disabled');
        });

        if (selectedDayDate.toDateString() === now.toDateString()) {
            timeRangeInputs.forEach(input => {
                const rangeEndHour = parseInt(input.value.split('-')[1].split(':')[0]);
                if (currentHour >= rangeEndHour) {
                    input.disabled = true;
                    input.parentElement.classList.add('disabled');
                }
            });
        }
    }

    function renderCalendar() {
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        const lastDateOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const lastDayOfPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

        monthElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        calendarGrid.innerHTML = '';

        const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        dayNames.forEach(day => {
            const dayNameCell = document.createElement('div');
            dayNameCell.classList.add('day-name');
            dayNameCell.textContent = day;
            calendarGrid.appendChild(dayNameCell);
        });

        let startingDay = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;
        for (let i = startingDay; i > 0; i--) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day', 'prev-month-day');
            dayCell.textContent = lastDayOfPrevMonth - i + 1;
            calendarGrid.appendChild(dayCell);
        }

        for (let i = 1; i <= lastDateOfMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day');
            dayCell.textContent = i;

            const date = new Date(currentYear, currentMonth, i);

            // Deshabilitar domingos y días pasados
            if ((date < today && date.toDateString() !== today.toDateString()) || date.getDay() === 0) {
                dayCell.classList.add('disabled-day');
            } else {
                dayCell.classList.add('selectable-day');
                dayCell.addEventListener('click', () => {
                    const selectedDay = document.querySelector('.selected');
                    if (selectedDay) {
                        selectedDay.classList.remove('selected');
                    }
                    dayCell.classList.add('selected');
                    selectedDate = `${i}/${currentMonth + 1}/${currentYear}`;
                    selectedDateObj = date;
                    bookingFormContainer.classList.add('visible');
                    updateHorarios(selectedDateObj);
                    console.log(`Fecha seleccionada: ${selectedDate}`);
                });
            }

            if (i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
                dayCell.classList.add('today');
            }
            calendarGrid.appendChild(dayCell);
        }

        const totalCells = startingDay + lastDateOfMonth;
        const nextDays = (totalCells % 7 === 0) ? 0 : 7 - (totalCells % 7);

        for (let i = 1; i <= nextDays; i++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day', 'next-month-day');
            dayCell.textContent = i;
            calendarGrid.appendChild(dayCell);
        }
        
        updateNavButtons();
    }

    function updateNavButtons() {
        const now = new Date();
        const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        if (currentYear === currentMonthDate.getFullYear() && currentMonth === currentMonthDate.getMonth()) {
            prevMonthButton.disabled = true;
        } else {
            prevMonthButton.disabled = false;
        }

        if (currentYear === nextMonthDate.getFullYear() && currentMonth === nextMonthDate.getMonth()) {
            nextMonthButton.disabled = true;
        } else {
            nextMonthButton.disabled = false;
        }
    }

    prevMonthButton.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });

    nextMonthButton.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });

    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectedTimeRange = document.querySelector('input[name="rango-horario"]:checked');
        const selectedPatente = selectorVehiculo.value;
        const btnReserva = bookingForm.querySelector('.btn-reserva');

        if (!selectedDate) {
            alert('Por favor, selecciona una fecha en el calendario.');
            return;
        }
        if (!selectedTimeRange) {
            alert('Por favor, selecciona un rango horario.');
            return;
        }
        if (!selectedPatente) {
            alert('Por favor, selecciona un vehículo. Si no tienes, regístralo en "Mis Autos".');
            return;
        }

        // Deshabilitar el botón para evitar clics múltiples
        btnReserva.disabled = true;
        btnReserva.textContent = 'Procesando...';

        // Construir la fecha y hora de inicio para enviar al backend
        const year = selectedDateObj.getFullYear();
        const month = String(selectedDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDateObj.getDate()).padStart(2, '0');
        const fechaSimple = `${year}-${month}-${day}`; // Formato YYYY-MM-DD
        const horarioSeleccionado = selectedTimeRange.value; // 1, 2, o 3
        const startTime = selectedTimeRange.dataset.startTime; // 08:00, 13:00, o 18:00
        const fechaHoraCompleta = `${fechaSimple}T${startTime}:00`;

        try {
            // 1. Verificar disponibilidad
            const disponibilidadResponse = await fetch(`http://localhost:3000/api/disponibilidad?fecha=${fechaSimple}&horario=${horarioSeleccionado}`);
            const disponibilidadData = await disponibilidadResponse.json();

            if (!disponibilidadResponse.ok || disponibilidadData.disponibles <= 0) {
                throw new Error(disponibilidadData.message || 'No hay lugares disponibles para ese horario.');
            }

            // 2. Si hay disponibilidad, realizar la reserva
            const userData = authManager.getUserData();
            if (!userData) {
                alert('Debes iniciar sesión para poder reservar.');
                window.location.href = 'index.html';
                return;
            }

            const reservaResponse = await fetch('http://localhost:3000/api/reservas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ legajo: userData.legajo, patente: selectedPatente, fecha: fechaHoraCompleta, horario: horarioSeleccionado })
            });
            const reservaData = await reservaResponse.json();

            alert(reservaData.message); // Mostrar mensaje de éxito o error de la reserva
            if (reservaResponse.ok) window.location.href = 'dashboard.html';

        } catch (error) {
            alert(error.message); // Muestra el error de disponibilidad o cualquier otro error de red
        } finally {
            // Volver a habilitar el botón
            btnReserva.disabled = false;
            btnReserva.textContent = 'Reservar';
        }
    });

    renderCalendar();

    // Cargar los vehículos del usuario al iniciar la página
    cargarVehiculosUsuario();
    cargarReservasUsuario();
});