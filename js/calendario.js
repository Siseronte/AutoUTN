document.addEventListener('DOMContentLoaded', () => {
    const monthElement = document.querySelector('.current-month');
    const prevMonthButton = document.querySelector('.prev-month');
    const nextMonthButton = document.querySelector('.next-month');
    const calendarGrid = document.querySelector('.calendar-grid');
    const bookingFormContainer = document.getElementById('booking-form-container');
    const bookingForm = document.getElementById('booking-form');
    const timeRangeInputs = document.querySelectorAll('input[name="rango-horario"]');

    let currentDate = new Date();
    currentDate.setDate(1);
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let selectedDate = null;
    let selectedDateObj = null;

    const today = new Date();

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

    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedTimeRange = document.querySelector('input[name="rango-horario"]:checked');

        if (!selectedDate) {
            alert('Por favor, selecciona una fecha en el calendario.');
            return;
        }

        if (!selectedTimeRange) {
            alert('Por favor, selecciona un rango horario.');
            return;
        }

        const timeRangeLabel = document.querySelector(`label[for=${selectedTimeRange.id}]`).textContent;

        alert(`Reserva confirmada:\n\nFecha: ${selectedDate}\nHorario: ${timeRangeLabel}`);

        // Aquí es donde enviarías los datos al backend
        console.log('Enviando datos al backend:', { fecha: selectedDate, horario: selectedTimeRange.value });
    });

    renderCalendar();
});